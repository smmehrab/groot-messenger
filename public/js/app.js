var incomingRequestList;
var outgoingRequestList;
var peopleList;
var friendsList;
var currentConversationId;
var chatOn = false;


var menu = document.getElementById('menu');
var chatWindow = document.getElementById('chatWindow');

var sendMessageInput = document.getElementById("sendMessage");
var fileInput = document.getElementById("fileInput");
var fileBtn = document.getElementById("fileBtn");
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

var chatsBtn = document.getElementById('chatsBtn');
var groupsBtn = document.getElementById('groupsBtn');
var friendsBtn = document.getElementById('friendsBtn');
var peopleBtn = document.getElementById('peopleBtn');
var backBtn = document.querySelector('#backBtn');

var chats = document.getElementById('chats');
var groups = document.getElementById('groups');
var friends = document.getElementById('friends');
var people = document.getElementById('people');

var conversationsDiv = document.getElementById('conversations');
var sendBtn = document.getElementById("sendBtn");

var signedOut = document.getElementById('signed-out');
var signedIn = document.getElementById('signed-in');
var signUpForm = document.getElementById('signup-form');
var signInForm = document.getElementById('signin-form');
var signOutBtn = document.getElementById('signOutBtn');

var isOfflineForDatabase = { state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP };
var isOnlineForDatabase = { state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP };

var isOfflineForFirestore = { state: 'offline', last_changed: firebase.firestore.FieldValue.serverTimestamp() };
var isOnlineForFirestore = { state: 'online', last_changed: firebase.firestore.FieldValue.serverTimestamp() };

var peopleDivDefaultHtml =
    `
<div id="searchPeopleDiv" class="row">
<a href="" id="searchPeopleBtn" class="brn col">
    <i id="searchPeopleIcon" class="material-icons">search</i>
</a>

<input id="searchPeopleInput" placeholder="Search People By Email" type="text" class="col" onkeypress="searchPeople(event)" >
</div>

<div id="requestsLabelDiv">
<p id="requestsLabel">Requests</p>
</div>
`;

/******************************************************************/

// For Tabs
function openTab(tabName) {
    var i, tabcontent;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}


// For Side Nav Toggle
var menuBtns = document.querySelectorAll('#menuBtn');
for (var i = 0; i < menuBtns.length; i++) {
    menuBtns[i].addEventListener('click', function (e) {
        e.preventDefault();
        chatWindow.classList.add('hide');
        menu.classList.add('show');
    });
}

/************************AUTH*********************************/
// Handling Sign Up
signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signUpForm['signup-email'].value;
    const password = signUpForm['signup-password'].value;
    const confirmPassword = signUpForm['signup-confirmPassword'].value;
    if (password != confirmPassword) {
        signUpForm.querySelector('.error').innerHTML = 'Password Confirmation Failed!';
    }
    else {
        // Create User
        document.getElementById('signUpBtnText').classList.add('hide');
        document.getElementById('signUpBtnIcon').classList.remove('hide');
        auth.createUserWithEmailAndPassword(email, password).then(cred => {
            document.getElementById('signUpBtnText').classList.remove('hide');
            document.getElementById('signUpBtnIcon').classList.add('hide');
            signedIn.classList.remove('hide');
            signedOut.classList.add('hide');
            signUpForm.reset();
        }).catch(err => {
            document.getElementById('signUpBtnText').classList.remove('hide');
            document.getElementById('signUpBtnIcon').classList.add('hide');
            signUpForm.querySelector('.error').innerHTML = err.message;
        });
    }
});

// Handling Sign In
signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signInForm['signin-email'].value;
    const password = signInForm['signin-password'].value;
    // Sign the User In
    document.getElementById('signInBtnText').classList.add('hide');
    document.getElementById('signInBtnIcon').classList.remove('hide');
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        document.getElementById('signInBtnText').classList.remove('hide');
        document.getElementById('signInBtnIcon').classList.add('hide');
        signedIn.classList.remove('hide');
        signedOut.classList.add('hide');
        signInForm.reset();
    }).catch(err => {
        document.getElementById('signInBtnText').classList.remove('hide');
        document.getElementById('signInBtnIcon').classList.add('hide');
        signInForm.querySelector('.error').innerHTML = err.message;
    });

});

// Handling Sign Out
signOutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signOutBtnIcon').innerHTML = "autorenew";
    document.getElementById('signOutBtnIcon').classList.add('loadingIcon');
    rdb.ref('.info/connected').once('value').then((snapshot) => {
        if (snapshot.val()) {
            var userStatusDatabaseRef = rdb.ref('/status/' + auth.currentUser.uid);
            var userStatusFirestoreRef = db.collection('status').doc(auth.currentUser.uid);
            auth.signOut().then(() => {
                document.getElementById('signOutBtnIcon').innerHTML = "exit_to_app";
                document.getElementById('signOutBtnIcon').classList.remove('loadingIcon');
                signedIn.classList.add('hide');
                signedOut.classList.remove('hide');
                var currently = "";
                localStorage.setItem("currently", currently);
                userStatusDatabaseRef.set(isOfflineForDatabase);
                userStatusFirestoreRef.set(isOfflineForFirestore);

                document.getElementById('chatsDiv').innerHTML = "";
                document.getElementById('friendsDiv').innerHTML = "";
                document.getElementById('peopleDiv').innerHTML = peopleDivDefaultHtml;
            });
        } else {
            document.getElementById('signOutBtnIcon').innerHTML = "exit_to_app";
            document.getElementById('signOutBtnIcon').classList.remove('loadingIcon');
            alert('Ensure Internet Connection to Sign Out');
        }
    });
});

// Handling Auth Status Change
auth.onAuthStateChanged(user => {
    if (user) {
        handlePresence();
        signedInUI();
        requestNotificationsPermissions();
    } else {
        signedOutUI();
    }
});

function signedInUI() {
    document.getElementById('profileName').innerHTML = auth.currentUser.email;
    signedIn.classList.remove('hide');
    signedOut.classList.add('hide');
    var currently = localStorage.getItem("currently");
    console.log(currently);
    if (currently === "chats" || !currently) {
        chatsBtn.click();
    } else if (currently === "groups") {
        groupsBtn.click();
    } else if (currently === "friends") {
        friendsBtn.click();
    } else if (currently === "people") {
        peopleBtn.click();
    }
}

function signedOutUI() {
    signedIn.classList.add('hide');
    signedOut.classList.remove('hide');
}


/************************ MENU *********************************/

document.addEventListener('DOMContentLoaded', function () {
});

backBtn.addEventListener('click', function (e) {
    e.preventDefault();
    chatOn = false;
    chatsBtn.click();
});

chatsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    setActive(this);
    displayChats();
});

groupsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    setActive(this);
    // displayGroups();
});

friendsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    setActive(this);
    displayFriends();
});

peopleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    setActive(this);
    displayPeople();
});

function setActive(x) {
    chatsBtn.parentElement.classList.remove('active');
    groupsBtn.parentElement.classList.remove('active');
    friendsBtn.parentElement.classList.remove('active');
    peopleBtn.parentElement.classList.remove('active');
    chats.classList.add('hide');
    groups.classList.add('hide');
    friends.classList.add('hide');
    people.classList.add('hide');
    conversations.classList.add('hide');

    var currently;
    if (x === chatsBtn) {
        currently = "chats";
        chatsBtn.parentElement.classList.add('active');
        chats.classList.remove('hide');
        chatOn = false;
    } else if (x === groupsBtn) {
        currently = "groups";
        groupsBtn.parentElement.classList.add('active');
        groups.classList.remove('hide');
    } else if (x === friendsBtn) {
        currently = "friends";
        friendsBtn.parentElement.classList.add('active');
        friends.classList.remove('hide');
    } else if (x === peopleBtn) {
        currently = "people";
        peopleBtn.parentElement.classList.add('active');
        people.classList.remove('hide');
    }

    localStorage.setItem("currently", currently);

    if (chatWindow.classList.contains('hide')) {
        chatWindow.classList.remove('hide');
        menu.classList.remove('show');
    };
}

/************************************ PEOPLE SECTION ******************************************/

function searchPeople(e) {
    if (e.keyCode === 13) {
        e.preventDefault();

        document.querySelectorAll('.searchResult').forEach((item) => {
            document.getElementById('peopleDiv').removeChild(item);
        });

        document.querySelector('#searchPeopleIcon').innerHTML = "";
        document.querySelector('#searchPeopleIcon').appendChild(document.createTextNode('autorenew'));
        document.querySelector('#searchPeopleIcon').classList.add('loadingIcon');

        var searchEmail = document.getElementById('searchPeopleInput').value;

        // const searchPeople = functions.httpsCallable("searchPeople");
        // searchPeople({ "email": searchEmail, "user": auth.currentUser.uid }).then((doc) => {

        //     console.log(doc);

        //     document.querySelector('#searchPeopleIcon').classList.remove('loadingIcon');
        //     document.querySelector('#searchPeopleIcon').innerHTML = "";
        //     document.querySelector('#searchPeopleIcon').appendChild(document.createTextNode('search'));
        // }).catch(function (error) {
        //     console.error("Error Finding People! => ", error);
        // });

        var users = db.collection('users').where("email", "==", searchEmail);
        users.get().then((result) => {
            if (result.size > 0) {
                result.docs.forEach(async (doc) => {
                    console.log(doc);
                    var type = 'searchResultGeneral';
                    var people = doc;

                    if (people.id == auth.currentUser.uid) {
                        renderNotFound('searchResult');
                        setTimeout(() => {
                            if (document.querySelector('.searchResult')) {
                                document.getElementById('peopleDiv').removeChild(document.querySelector('.searchResult'));
                            }
                        }, 3000);
                    } else {
                        const ifIncoming = await db.collection('requests').where("sender", "==", people.id).where("receiver", "==", auth.currentUser.uid).get();
                        if (ifIncoming.size > 0) {
                            type = 'searchResultIncoming';
                        }

                        const ifOutgoing = await db.collection('requests').where("sender", "==", auth.currentUser.uid).where("receiver", "==", people.id).get();
                        if (ifOutgoing.size > 0) {
                            type = 'searchResultOutgoing';
                        }

                        const ifFriend = await db.collection('userFriends').doc(auth.currentUser.uid).collection('friends').doc(people.id).get();
                        if (ifFriend.exists) {
                            type = 'searchResultFriend';
                        }

                        renderPeople(type, people.data().email);
                    }
                });
            } else {
                renderNotFound('searchResult');
                setTimeout(() => {
                    if (document.querySelector('.searchResult')) {
                        document.getElementById('peopleDiv').removeChild(document.querySelector('.searchResult'));
                    }
                }, 3000);
            }
        });
    }
}

function displayPeople() {
    var users = db.collection('users');
    var incomingRequests = db.collection('requests').where("receiver", "==", auth.currentUser.uid);
    var outgoingRequests = db.collection('requests').where("sender", "==", auth.currentUser.uid);

    outgoingRequests.get().then((snapshotOut) => {
        outgoingRequestList = [];
        document.getElementById('peopleDiv').innerHTML = peopleDivDefaultHtml;
        snapshotOut.docs.map(doc => doc.data()).forEach((doc) => {
            if (doc.receiver != auth.currentUser.uid) {
                console.log('outgoing');
                users.doc(doc.receiver).get().then((user) => {
                    console.log(user.data());
                    renderPeople("outgoing", user.data().email);
                    outgoingRequestList.push(user.data().email);
                });
            }
        });

        incomingRequests.get().then((snapshotIn) => {
            incomingRequestList = [];
            snapshotIn.docs.map(doc => doc.data()).forEach((doc) => {
                if (doc.sender != auth.currentUser.uid) {
                    console.log('incoming');
                    users.doc(doc.sender).get().then(function (user) {
                        console.log(user.data());
                        renderPeople("incoming", user.data().email);
                        incomingRequestList.push(user.data().email);
                    });
                }
            });

            if (incomingRequestList.length == 0 && outgoingRequestList.length == 0) {
                renderNotFound('requests');
            }
        });
    });
}

function renderNotFound(type) {
    var notFoundDiv = document.createElement('div');
    notFoundDiv.id = 'notFoundDiv';

    if (type == 'searchResult') {
        notFoundDiv.classList.add('searchResult');
    }

    var notFoundP = document.createElement('p');
    notFoundP.id = 'notFoundP';

    if (type == 'requests') {
        notFoundP.appendChild(document.createTextNode('No Requests Available'));
    } else if (type == 'searchResult') {
        notFoundP.appendChild(document.createTextNode('No People Found'));
    }

    notFoundDiv.appendChild(notFoundP);

    if (type == 'requests') {
        notFoundDiv.appendAfter(document.getElementById('requestsLabelDiv'));
    } else if (type == 'searchResult') {
        document.querySelector('#searchPeopleIcon').classList.remove('loadingIcon');
        document.querySelector('#searchPeopleIcon').innerHTML = "";
        document.querySelector('#searchPeopleIcon').appendChild(document.createTextNode('search'));

        notFoundDiv.appendAfter(document.getElementById('searchPeopleDiv'));
    }
}

function renderPeople(type, email) {
    var peopleItem = document.createElement('li');
    peopleItem.id = "peopleItem";
    peopleItem.classList.add('row');

    if (type == 'searchResultGeneral' || type == 'searchResultIncoming' || type == 'searchResultOutgoing' || type == 'searchResultFriend') {
        peopleItem.classList.add('searchResult');
    }

    var picture = document.createElement('img');
    picture.id = "picture";
    picture.src = 'img/groot_g.png';
    picture.classList.add('col');
    peopleItem.appendChild(picture);

    var details = document.createElement('div');
    details.id = "details";
    details.classList.add('col');

    var detailsInside = document.createElement('div');
    detailsInside.id = "detailsInside";

    var peopleTitle = document.createElement('p');
    peopleTitle.id = "peopleTitle";
    peopleTitle.appendChild(document.createTextNode(email));

    var peopleBio = document.createElement('p');
    peopleBio.id = "peopleBio";
    peopleBio.appendChild(document.createTextNode("I'm Groot"));

    detailsInside.appendChild(peopleTitle);
    detailsInside.appendChild(peopleBio);
    details.appendChild(detailsInside);
    peopleItem.appendChild(details);

    var status = document.createElement('div');
    status.id = "status";
    status.classList.add('col');

    var statusInside = document.createElement('div');
    statusInside.id = "statusInside";

    var peopleAddFriend = document.createElement('a');
    peopleAddFriend.id = "peopleAddFriend";
    peopleAddFriend.href = "";

    var addFriend = document.createElement('i');
    addFriend.classList.add('material-icons');
    addFriend.classList.add('addFriend');

    if (type == "searchResultGeneral") {
        addFriend.appendChild(document.createTextNode("person_add"));
    } else if (type == "outgoing" || type == 'searchResultOutgoing') {
        addFriend.appendChild(document.createTextNode("person_add_disabled"));
    } else if (type == "incoming" || type == 'searchResultIncoming') {
        addFriend.appendChild(document.createTextNode("check"));
    }

    if (type == "incoming" || type == 'searchResultIncoming') {
        var peopleRejectFriend = document.createElement('a');
        peopleRejectFriend.id = "peopleAddFriend";
        peopleRejectFriend.href = "";

        var rejectFriend = document.createElement('i');
        rejectFriend.classList.add('material-icons');
        rejectFriend.classList.add('addFriend');

        rejectFriend.appendChild(document.createTextNode("clear"));

        rejectFriend.addEventListener('click', (e) => {
            e.preventDefault();
            handleFriendRequest("reject", email, addFriend, rejectFriend);
        });

        peopleRejectFriend.appendChild(rejectFriend);
    }


    addFriend.addEventListener('click', (e) => {
        e.preventDefault();

        if (addFriend.innerHTML == "check") {
            handleFriendRequest("accept", email, addFriend, rejectFriend);
        } else if (addFriend.innerHTML == "person_add") {
            addAsFriend("send", email, addFriend);
        } else {
            addAsFriend("cancel", email, addFriend);
        }
    });

    peopleAddFriend.appendChild(addFriend);


    var peopleViewProfile = document.createElement('a');
    peopleViewProfile.id = "peopleViewProfile";
    peopleViewProfile.href = "";

    var viewPeopleProfile = document.createElement('i');
    viewPeopleProfile.classList.add('material-icons');
    viewPeopleProfile.classList.add('viewPeopleProfile');
    viewPeopleProfile.appendChild(document.createTextNode("info"));

    peopleViewProfile.appendChild(viewPeopleProfile);
    statusInside.appendChild(peopleAddFriend);
    if (type == "incoming" || type == 'searchResultIncoming') {
        statusInside.appendChild(peopleRejectFriend);
    }
    statusInside.appendChild(peopleViewProfile);
    status.appendChild(statusInside);
    peopleItem.appendChild(status);

    if (type == 'searchResultGeneral' || type == 'searchResultIncoming' || type == 'searchResultOutgoing' || type == 'searchResultFriend') {
        document.querySelector('#searchPeopleIcon').classList.remove('loadingIcon');
        document.querySelector('#searchPeopleIcon').innerHTML = "";
        document.querySelector('#searchPeopleIcon').appendChild(document.createTextNode('search'));

        document.querySelectorAll('.searchResult').forEach((item) => {
            document.getElementById('peopleDiv').removeChild(item);
        });

        peopleItem.appendAfter(document.getElementById('searchPeopleDiv'));
    } else {
        document.querySelectorAll('#notFoundDiv').forEach((item) => {
            document.getElementById('peopleDiv').removeChild(item);
        });

        peopleItem.appendAfter(document.getElementById('requestsLabelDiv'));
    }
}

Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
}, false;

function GetElementInsideContainer(containerID, childID) {
    var elm = document.getElementById(childID);
    var parent = elm ? elm.parentNode : {};
    return (parent.id && parent.id === containerID) ? elm : {};
}

function addAsFriend(status, email, addFriend) {
    addFriend.innerHTML = 'autorenew';
    addFriend.classList.add('loadingIcon');

    var remotePerson;
    var user = auth.currentUser.uid;
    var query = db.collection('users').where("email", "==", email);
    query.get().then((snapshot) => {
        snapshot.docs.map(doc => doc.id).forEach(function (doc) {
            remotePerson = doc;
        });

        if (status == "send") {
            const addRequest = functions.httpsCallable("addRequest");
            addRequest({ "sender": user, "receiver": remotePerson }).then(function (doc) {
                console.log("Request Sent");
                console.log(doc);
                addFriend.innerHTML = "";
                addFriend.classList.remove('loadingIcon');
                addFriend.appendChild(document.createTextNode("person_add_disabled"));
                peopleBtn.click();
            }).catch(function (error) {
                console.error("Error Sending Request! => ", error);
            });
        } else if (status == "cancel") {
            const cancelRequest = firebase.functions().httpsCallable("cancelRequest");
            cancelRequest({ "sender": user, "receiver": remotePerson }).then(function (doc) {
                console.log("Request Cancelled");
                addFriend.innerHTML = "";
                addFriend.classList.remove('loadingIcon');
                addFriend.appendChild(document.createTextNode("person_add"));
            }).catch(function (error) {
                console.error("Error Cancelling Request! => ", error);
            });
        }
    });
}


function handleFriendRequest(status, email, addFriend, rejectFriend) {
    rejectFriend.style.display = "none";
    addFriend.innerHTML = 'autorenew';
    addFriend.classList.add('loadingIcon');

    var remotePerson;
    var user = auth.currentUser.uid;
    var query = db.collection('users').where("email", "==", email);
    query.get().then((snapshot) => {
        snapshot.docs.map(doc => doc.id).forEach(function (doc) {
            remotePerson = doc;
        });

        if (status == "accept") {
            const acceptRequest = firebase.functions().httpsCallable("acceptRequest");
            acceptRequest({ "sender": remotePerson, "receiver": user }).then(function (doc) {
                console.log("Request Accepted");
                console.log(doc);
                addFriend.innerHTML = "";
                rejectFriend.innerHTML = "";
                addFriend.classList.remove('loadingIcon');
                addFriend.style.display = "none";
                rejectFriend.style.display = "none";
            }).catch(function (error) {
                console.error("Error Accepting Request! => ", error);
            });
        } else if (status == "reject") {
            const cancelRequest = firebase.functions().httpsCallable("cancelRequest");
            cancelRequest({ "sender": remotePerson, "receiver": user }).then(function (doc) {
                console.log("Request Rejected");
                addFriend.innerHTML = "";
                rejectFriend.innerHTML = "";
                addFriend.classList.remove('loadingIcon');
                rejectFriend.style.display = "none";
                addFriend.appendChild(document.createTextNode("person_add"));
            }).catch(function (error) {
                console.error("Error Rejecting Request! => ", error);
            });
        }
    });
}

/************************************ FRIENDS SECTION ******************************************/
function displayFriends() {
    var userFriendsRef = db.collection('userFriends').doc(auth.currentUser.uid).collection('friends');
    userFriendsRef.get().then((friends) => {
        friendsList = [];
        document.getElementById('friendsDiv').innerHTML = "";
        friends.docs.forEach((friend) => {
            renderFriend(friend);
            friendsList.push(friend);
        });
    });
}

function renderFriend(friend) {
    var email = friend.data().email;
    var friendItem = document.createElement('li');
    friendItem.id = "friendItem";
    friendItem.classList.add('row');

    var picture = document.createElement('img');
    picture.id = "picture";
    picture.src = 'img/groot_g.png';
    picture.classList.add('col');
    friendItem.appendChild(picture);

    var details = document.createElement('div');
    details.id = "details";
    details.classList.add('col');

    var detailsInside = document.createElement('div');
    detailsInside.id = "detailsInside";

    var friendTitle = document.createElement('p');
    friendTitle.id = "friendTitle";
    friendTitle.appendChild(document.createTextNode(email));

    var friendLastActive = document.createElement('p');
    friendLastActive.id = "friendLastActive";

    maintainStatus(friend.id, friendLastActive);
    // friendLastActive.appendChild(document.createTextNode("Yesterday"));

    detailsInside.appendChild(friendTitle);
    detailsInside.appendChild(friendLastActive);
    details.appendChild(detailsInside);
    friendItem.appendChild(details);

    var status = document.createElement('div');
    status.id = "status";
    status.classList.add('col');

    var statusInside = document.createElement('div');
    statusInside.id = "statusInside";

    var friendChatWith = document.createElement('a');
    friendChatWith.id = "friendChatWith";
    friendChatWith.href = "";

    var messageFriend = document.createElement('i');
    messageFriend.classList.add('material-icons');
    messageFriend.classList.add('messageFriend');
    messageFriend.appendChild(document.createTextNode("message"));

    messageFriend.addEventListener('click', (e) => {
        e.preventDefault();
        chatWithFriend(friend, messageFriend);
    });

    friendChatWith.appendChild(messageFriend);

    var friendViewProfile = document.createElement('a');
    friendViewProfile.id = "friendViewProfile";
    friendViewProfile.href = "";

    var viewFriendProfile = document.createElement('i');
    viewFriendProfile.classList.add('material-icons');
    viewFriendProfile.classList.add('viewFriendProfile');
    viewFriendProfile.appendChild(document.createTextNode("info"));

    friendViewProfile.appendChild(viewFriendProfile);
    statusInside.appendChild(friendChatWith);
    statusInside.appendChild(friendViewProfile);
    status.appendChild(statusInside);
    friendItem.appendChild(status);

    document.getElementById('friendsDiv').appendChild(friendItem);
}

function chatWithFriend(friend, messageFriend) {
    messageFriend.innerHTML = 'autorenew';
    messageFriend.classList.add('loadingIcon');

    var user1 = auth.currentUser.uid;
    var user2 = friend.id;

    // Sort Users
    if (user1 > user2) {
        temp = user1;
        user1 = user2;
        user2 = temp;
    }

    var friendshipsRef = db.collection("friendships").where("friend1", "==", user1).where("friend2", "==", user2);
    friendshipsRef.get().then((snapshot) => {
        snapshot.docs.map(doc => doc.id).forEach(function (doc) {
            currentConversationId = doc;
            messageFriend.innerHTML = '';
            messageFriend.classList.remove('loadingIcon');
            messageFriend.appendChild(document.createTextNode("message"));

            openConversation(doc, friend.data().email);
        });
    });
}

/************************************ CHATS SECTION ******************************************/
function displayChats() {
    // LOAD MESSAGES from specific CONVERSATION ordered by timestamp(at)
    var chatsRef = db.collection('userChats').doc(auth.currentUser.uid).collection('chats').orderBy("last_at", "desc");
    chatsRef.onSnapshot(function (result) {
        document.getElementById('chatsDiv').innerHTML = "";
        result.docChanges().forEach(function (change) {

            console.log(change.type);
            console.log(change.doc.data().with);
            console.log(change.doc.data());

            if (change.type === 'modified' && !chatOn) {
                chatsBtn.click();
            } else if (change.type === 'added' && !chatOn) {
                renderChat(change.doc.id, change.doc.data());
            }
        });
    });
}

function renderChat(id, data) {
    var chatItem = document.createElement('li');
    chatItem.id = "chatItem";
    chatItem.classList.add('row');

    var picture = document.createElement('img');
    picture.id = "picture";
    picture.src = 'img/groot_g.png';
    picture.classList.add('col');


    var details = document.createElement('div');
    details.id = "details";
    details.classList.add('col');

    var detailsInside = document.createElement('div');
    detailsInside.id = "detailsInside";

    var chatTitle = document.createElement('p');
    chatTitle.id = "chatTitle";


    chatTitle.appendChild(document.createTextNode(data.with));

    var chatLastMessage = document.createElement('p');
    chatLastMessage.id = "chatLastMessage";

    if (data.last_message.length > 25) {
        chatLastMessage.appendChild(document.createTextNode(data.last_message.substring(0, 22) + '...'));
    } else {
        chatLastMessage.appendChild(document.createTextNode(data.last_message));
    }

    detailsInside.appendChild(chatTitle);
    detailsInside.appendChild(chatLastMessage);
    details.appendChild(detailsInside);

    var status = document.createElement('div');
    status.id = "status";
    status.classList.add('col');

    var statusInside = document.createElement('div');
    statusInside.id = "statusInside";

    if (data.notification > 0) {
        var chatNewMessageCount = document.createElement('p');
        chatNewMessageCount.id = "chatNewMessageCount";
        chatNewMessageCount.appendChild(document.createTextNode(data.notification));
    }

    var chatLastModified = document.createElement('p');
    chatLastModified.id = "chatLastModified";

    var d = data.last_at.toDate();
    var datestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " " +
        ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear();

    chatLastModified.appendChild(document.createTextNode(datestring));

    if (data.notification > 0) {
        statusInside.appendChild(chatNewMessageCount);
    }
    statusInside.appendChild(chatLastModified);
    status.appendChild(statusInside);

    chatItem.appendChild(picture);
    chatItem.appendChild(details);
    chatItem.appendChild(status);

    chatItem.addEventListener('click', (e) => {
        e.preventDefault();
        currentConversationId = id;
        openConversation(id, data.with);
    })

    document.getElementById('chatsDiv').appendChild(chatItem);
}


/************************************ CONVERSATION SECTION ******************************************/
sendBtn.addEventListener('click', function (e) {
    e.preventDefault();

    if (fileInput.value) {
        sendBtn.disabled = true;
        sendImage(currentFile);
        resetSendDiv();
    }
    else if (sendMessageInput.value) {
        sendBtn.disabled = true;
        var message = sendMessageInput.value;
        sendMessage(message);
        resetSendDiv();
    }
});

// Triggered when a file is selected via the media picker.
fileInput.addEventListener('input', onMediaFileSelected);
function onMediaFileSelected(event) {
    event.preventDefault();
    sendMessageInput.value = fileInput.value;
    var file = event.target.files[0];
    currentFile = file;

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        var data = {
            message: 'You can only share images',
            timeout: 2000
        };
        console.log(data);
        resetSendDiv();
        return;
    }
}

function resetSendDiv() {
    if (sendMessageInput.value) {
        sendBtn.disabled = false;
        sendMessageInput.value = "";
        fileInput.value = "";
    }
}

function sendMessage(messageBody) {
    // Send to firestore database
    db.collection("conversations").doc(currentConversationId).collection('messages').add({
        body: messageBody,
        sender: auth.currentUser.email,
        at: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function (doc) {
        console.log("Message Sent!");
    }).catch(function (error) {
        console.error("Error Sending Message! => ", error);
    });
}


// Saves a new message containing an image in Firebase.
// This first saves the image in Firebase storage.
function sendImage(file) {
    // 1 - We add a message with a loading icon that will get updated with the shared image.
    db.collection("conversations").doc(currentConversationId).collection('messages').add({
        image: LOADING_IMAGE_URL,
        sender: auth.currentUser.email,
        at: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function (messageRef) {
        // 2 - Upload the image to Cloud Storage.
        var filePath = auth.currentUser.uid + '/' + messageRef.id + '/' + file.name;
        return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
            // 3 - Generate a public URL for the file.
            return fileSnapshot.ref.getDownloadURL().then((url) => {
                // 4 - Update the chat message placeholder with the image’s URL.
                return messageRef.update({
                    image: url,
                    storageUri: fileSnapshot.metadata.fullPath
                });
            });
        });
    }).catch(function (error) {
        console.error('There was an error uploading a file to Cloud Storage:', error);
    });
}

function openConversation(conversationId, email) {
    groupsBtn.parentElement.classList.remove('active');
    friendsBtn.parentElement.classList.remove('active');
    peopleBtn.parentElement.classList.remove('active');
    chatsBtn.parentElement.classList.add('active');

    chats.classList.add('hide');
    groups.classList.add('hide');
    friends.classList.add('hide');
    people.classList.add('hide');
    conversations.classList.remove('hide');

    document.getElementById('conversationTitle').innerHTML = email;
    document.querySelector("#messagesDiv").innerHTML = "";
    var preloaderImageDiv;
    chatOn = true;

    // LOAD MESSAGES from specific CONVERSATION ordered by timestamp(at)
    var messageRef = db.collection('conversations').doc(conversationId).collection('messages').orderBy("at");
    messageRef.onSnapshot(function (result) {
        result.docChanges().forEach(function (change) {

            // console.log(change.type);
            // console.log(change.doc.data());
            // console.log(change.doc.data().body);

            // PRELOADER IMAGE
            if (change.doc.data().image == LOADING_IMAGE_URL) {
                if (change.type === 'added') {
                    console.log(change.type);
                    console.log(change.doc.data().image);

                    var updatedMessage = change.doc.data();
                    var messageDiv = document.createElement('div');
                    messageDiv.classList.add("imageMessage");

                    var senderSpan = document.createElement('span');

                    var img = document.createElement('img');
                    img.src = updatedMessage.image;

                    if (updatedMessage.sender != email) {
                        senderSpan.classList.add("sender");
                        img.classList.add("senderImgBody");
                    } else {
                        senderSpan.classList.add("receiver");
                        img.classList.add("receiverImgBody");
                    }

                    senderSpan.appendChild(document.createTextNode(updatedMessage.sender));

                    var messageImageSpan = document.createElement('span');
                    messageImageSpan.classList.add("imageBody");
                    messageImageSpan.appendChild(img);

                    messageDiv.appendChild(senderSpan);
                    var brDiv = document.createElement('br');
                    messageDiv.appendChild(brDiv);
                    messageDiv.appendChild(messageImageSpan);

                    preloaderImageDiv = messageDiv;

                    document.querySelector("#messagesDiv").appendChild(messageDiv);
                    document.querySelector("#messagesDiv").scrollTop = document.querySelector("#messagesDiv").scrollHeight;
                }
            }

            // IMAGE
            else if (change.doc.data().image && (change.type === 'added' || change.type === 'modified')) {

                console.log(change.type);
                console.log(change.doc.data().image);

                var updatedMessage = change.doc.data();
                var messageDiv = document.createElement('div');
                messageDiv.classList.add("imageMessage");

                var senderSpan = document.createElement('span');

                var img = document.createElement('img');
                img.src = updatedMessage.image;

                if (updatedMessage.sender != email) {
                    senderSpan.classList.add("sender");
                    img.classList.add("senderImgBody");
                } else {
                    senderSpan.classList.add("receiver");
                    img.classList.add("receiverImgBody");
                }

                senderSpan.appendChild(document.createTextNode(updatedMessage.sender));

                var messageImageSpan = document.createElement('span');
                messageImageSpan.classList.add("imageBody");
                messageImageSpan.appendChild(img);

                messageDiv.appendChild(senderSpan);
                var brDiv = document.createElement('br');
                messageDiv.appendChild(brDiv);
                messageDiv.appendChild(messageImageSpan);

                if (preloaderImageDiv) {
                    document.querySelector("#messagesDiv").removeChild(preloaderImageDiv);
                }

                document.querySelector("#messagesDiv").appendChild(messageDiv);
                document.querySelector("#messagesDiv").scrollTop = document.querySelector("#messagesDiv").scrollHeight;
            }

            // TEXT
            else if (change.type === 'added') {
                var updatedMessage = change.doc.data();
                var messageDiv = document.createElement('div');
                messageDiv.classList.add("message");

                var senderSpan = document.createElement('span');
                var messageBody = document.createElement('p');

                if (updatedMessage.sender != email) {
                    senderSpan.classList.add("sender");
                    messageBody.classList.add("senderMessageBody");
                } else {
                    senderSpan.classList.add("receiver");
                    messageBody.classList.add("receiverMessageBody");
                }

                senderSpan.appendChild(document.createTextNode(updatedMessage.sender));
                var br = document.createElement('br');

                // HANDLING LINKS
                if (updatedMessage.body.indexOf("https://") >= 0) {
                    var text = "", link = "";
                    var i;

                    for (i = 0; i < updatedMessage.body.indexOf("https://"); i++) {
                        text += updatedMessage.body[i];
                    }
                    if (text) {
                        var text1 = document.createTextNode(text);
                        messageBody.appendChild(text1);
                    }

                    for (i = updatedMessage.body.indexOf("https://"); i < updatedMessage.body.length; i++) {
                        link += updatedMessage.body[i];
                        if (updatedMessage.body[i + 1] == " ") {
                            break;
                        }
                    }
                    var linkText = document.createTextNode(link);
                    var anchor = document.createElement('a');
                    anchor.href = link;
                    anchor.style.color = "blue";
                    anchor.style.textDecoration = "underline";
                    anchor.target = "_blank";
                    anchor.append(linkText);

                    messageBody.appendChild(anchor);

                    text = "";
                    for (++i; i < updatedMessage.body.length; i++) {
                        text += updatedMessage.body[i];
                    }
                    if (text) {
                        var text2 = document.createTextNode(text);
                        messageBody.appendChild(text2);
                    }
                }

                // HANDLING NORMAL TEXT
                else {
                    messageBody.appendChild(document.createTextNode(updatedMessage.body));
                }

                messageDiv.appendChild(senderSpan);
                messageDiv.appendChild(br);
                messageDiv.appendChild(messageBody);

                document.querySelector("#messagesDiv").appendChild(messageDiv);
                document.querySelector("#messagesDiv").scrollTop = document.querySelector("#messagesDiv").scrollHeight;
            }
        });

        // Mark As Seen
        db.collection('userChats').doc(auth.currentUser.uid).collection('chats').doc(conversationId).update({
            notification: 0
        }).then(() => {
            console.log("Marked As Seen");
        });
    });
}

/******************************************** PRESENCE ****************************************************** */
function handlePresence() {
    var userStatusDatabaseRef = rdb.ref('/status/' + auth.currentUser.uid);
    var userStatusFirestoreRef = db.collection('status').doc(auth.currentUser.uid);

    rdb.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() == false) {
            userStatusFirestoreRef.set(isOfflineForFirestore);
            return;
        }

        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(() => {
            userStatusDatabaseRef.set(isOnlineForDatabase);
            userStatusFirestoreRef.set(isOnlineForFirestore);
        });
    });

    // Locally
    userStatusFirestoreRef.onSnapshot((doc) => {
        var isOnline = doc.data().state == 'online';
        console.log(isOnline);
        // ... use isOnline
    });
}

// Remotely
function maintainStatus(userId, statusContainer) {
    firebase.firestore().collection('status')
        .doc(userId).onSnapshot((snapshot) => {
            if (snapshot.data().state == "offline") {
                var status = "active ";

                var lastActive = snapshot.data().last_changed.toDate();
                var now = new Date();
                var mil = now - lastActive;

                var seconds = (mil / 1000) | 0;
                mil -= seconds * 1000;
                var minutes = (seconds / 60) | 0;
                seconds -= minutes * 60;
                var hours = (minutes / 60) | 0;
                minutes -= hours * 60;
                var days = (hours / 24) | 0;
                hours -= days * 24;
                var weeks = (days / 7) | 0;
                days -= weeks * 7;

                if (weeks) {
                    status += weeks + "w";
                } else if (days) {
                    status += days + "d";
                } else if (hours) {
                    status += hours + "h";
                } else if (minutes) {
                    status += minutes + "m";
                } else {
                    status += "few seconds";
                }

                status += " ago";
                statusContainer.innerHTML = "";
                statusContainer.appendChild(document.createTextNode(status));
            } else {
                statusContainer.innerHTML = "";
                statusContainer.appendChild(document.createTextNode(snapshot.data().state));
            }
        });
}


/******************************************** PUSH NOTIFICATION ****************************************************** */
// Saves the messaging device token to the datastore.
function saveMessagingDeviceToken() {
    firebase.messaging().getToken().then(function (currentToken) {
        if (currentToken) {
            console.log('Got FCM device token:', currentToken);
            // Saving the Device Token to the datastore.
            firebase.firestore().collection('fcmTokens').doc(currentToken)
                .set({ uid: firebase.auth().currentUser.uid });
        } else {
            // Need to request permissions to show notifications.
            requestNotificationsPermissions();
        }
    }).catch(function (error) {
        console.error('Unable to get messaging token.', error);
    });
}

// Requests permission to show notifications.
function requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(function () {
        // Notification permission granted.
        saveMessagingDeviceToken();
    }).catch(function (error) {
        console.error('Unable to get permission to notify.', error);
    });
}