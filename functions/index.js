// const express = require('express');
// const compression = require('compression');

// const app = express();
// app.use(compression());
// app.use(express.static('./public'));


// // Firing Controllers
// var requestHandler = require('./controllers/requestHandler');
// requestHandler(app);


// // App On Fire
// exports.app = functions.https.onRequest(app);

// Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/* Auth Triggers */
// Sign Up
exports.signUp = functions.auth.user().onCreate((user) => {
    console.log(user.uid + " " + user.email + " Signed Up");
    return admin.firestore().collection('users').doc(user.uid).set({
        email: user.email
    });
});

// Delete Account
exports.deleteAcc = functions.auth.user().onDelete((user) => {
    console.log(user.uid + " " + user.email + " Deleted");
    const doc = admin.firestore().collection('users').doc(user.uid);
    return doc.delete();
});

// Add Friend Request
exports.addRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Please, Authenticate Yourself!');
    }

    // Clear Previous Request
    var query = admin.firestore().collection('requests').where("sender", "==", data.sender).where("receiver", "==", data.receiver);
    const docs = await query.get();
    docs.forEach((doc) => {
        doc.ref.delete();
    });

    return admin.firestore().collection('requests').add({
        sender: data.sender,
        receiver: data.receiver
    }).then((doc) => {
        return { id: doc.id };
    });
});

// Cancel Friend Request
exports.cancelRequest = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Please, Authenticate Yourself!');
    }

    var query = admin.firestore().collection('requests').where("sender", "==", data.sender).where("receiver", "==", data.receiver);
    query.get().then((docs) => {
        return docs.forEach((doc) => {
            return doc.ref.delete();
        });
    }).catch(err => {
        console.log(err);
    });
});

// Add as Friend
exports.acceptRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Please, Authenticate Yourself!');
    }

    // Clear Request
    var requestsRef = admin.firestore().collection('requests').where("sender", "==", data.sender).where("receiver", "==", data.receiver);
    const requests = await requestsRef.get();
    requests.forEach((request) => {
        request.ref.delete();
    });

    var user1 = data.sender;
    var user2 = data.receiver;

    const findUser1 = await admin.firestore().collection('users').doc(user1).get();
    admin.firestore().collection('userFriends').doc(user2).collection('friends').doc(user1).set(findUser1.data());

    const findUser2 = await admin.firestore().collection('users').doc(user2).get();
    admin.firestore().collection('userFriends').doc(user1).collection('friends').doc(user2).set(findUser2.data());

    // Sort Users
    if (user1 > user2) {
        temp = user1;
        user1 = user2;
        user2 = temp;
    }

    // Create Friendship
    return admin.firestore().collection('friendships').add({
        friend1: user1,
        friend2: user2
    }).then((doc) => {

        admin.firestore().collection('userChats').doc(user1).collection('chats').doc(doc.id).set({
            notification: 0
        });

        admin.firestore().collection('userChats').doc(user2).collection('chats').doc(doc.id).set({
            notification: 0
        });

        admin.firestore().collection('conversations').doc(doc.id).collection('messages').add({});

        return { id: doc.id };
    });
});

// Search People
exports.searchPeople = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Please, Authenticate Yourself!');
    }

    var searchEmail = data.email;
    var user = data.user;
    var type = null;
    var searchResult = null;

    return admin.firestore().collection('users').where("email", "==", searchEmail).get().then((findPeople) => {
        console.log(findPeople.size);

        return findPeople.docs.forEach(async (people) => {
            console.log(people);
            console.log(people.id);
            console.log(people.data());
    
            searchResult = people;
            type = 'general';

            // const ifIncoming = await admin.firestore().collection('requests').where("sender", "==", people.id).where("receiver", "==", user).get();
            // console.log(ifIncoming.size);
            // console.log(ifIncoming);
            // if (ifIncoming.size > 0) {
            //     type = 'ingoing';
            // }
    
            // const ifOutgoing = await admin.firestore().collection('requests').where("sender", "==", user).where("receiver", "==", people.id).get();
            // console.log(ifOutgoing.size);
            // console.log(ifOutgoing);
            // if (ifOutgoing.size > 0) {
            //     type = 'outgoing';
            // }
    
            // const ifFriend = await admin.firestore().collection('userFriends').doc(user).collection('friends').doc(people.id).get();
            // console.log(ifFriend.exists);
            // console.log(ifFriend);
            // if (ifFriend.exists) {
            //     type = 'friend';
            // }
    
            console.log(searchResult);
            console.log(type);
            return { "people": searchResult, "type": type };
        });
    });
});

exports.conversationTrigger = functions.firestore
    .document('conversations/{conversationId}/messages/{id}')
    .onCreate(async (snap, context) => {
        const newMessage = snap.data();

        const last_at = newMessage.at;
        var last_sender;
        const user = await admin.firestore().collection('users').where("email", "==", newMessage.sender).get();
        user.docs.map(doc => doc.id).forEach((doc) => {
            last_sender = doc;
        });

        var last_message;
        if (newMessage.body) {
            last_message = newMessage.body;
        } else if (newMessage.image) {
            last_message = "Image";
        }

        var user1, user2, email1, email2;
        const doc = await admin.firestore().collection('friendships').doc(context.params.conversationId).get();
        user1 = doc.data().friend1;
        user2 = doc.data().friend2;

        // eslint-disable-next-line eqeqeq
        if (user1 == last_sender) {
            email1 = newMessage.sender;
            const findEmail = await admin.firestore().collection('users').doc(user2).get();
            email2 = findEmail.data().email;

            admin.firestore().collection('userChats').doc(user1).collection('chats').doc(context.params.conversationId).update({
                with: email2,
                last_message: last_message,
                last_at: last_at,
                notification: 0
            });
            admin.firestore().collection('userChats').doc(user2).collection('chats').doc(context.params.conversationId).update({
                with: email1,
                last_message: last_message,
                last_at: last_at,
                notification: admin.firestore.FieldValue.increment(1)
            });
            // eslint-disable-next-line eqeqeq
        } else if (user2 == last_sender) {
            email2 = newMessage.sender;
            const findEmail = await admin.firestore().collection('users').doc(user1).get();
            email1 = findEmail.data().email;

            admin.firestore().collection('userChats').doc(user1).collection('chats').doc(context.params.conversationId).update({
                with: email2,
                last_message: last_message,
                last_at: last_at,
                notification: admin.firestore.FieldValue.increment(1)
            });
            admin.firestore().collection('userChats').doc(user2).collection('chats').doc(context.params.conversationId).update({
                with: email1,
                last_message: last_message,
                last_at: last_at,
                notification: 0
            });
        }
    });

exports.onUserStatusChanged = functions.database.ref('/status/{userId}').onUpdate(
    async (change, context) => {
        const eventStatus = change.after.val();
        const userStatusFirestoreRef = admin.firestore().collection('status').doc(context.params.userId);
        const statusSnapshot = await change.after.ref.once('value');
        const status = statusSnapshot.val();
        console.log(status, eventStatus);
        if (status.last_changed > eventStatus.last_changed) {
            return null;
        }
        eventStatus.last_changed = new Date(eventStatus.last_changed);
        return userStatusFirestoreRef.set(eventStatus);
    });

// Sends a notifications to all users when a new message is posted.
exports.sendNotifications = functions.firestore.document('conversations/{conversationId}/messages/{messageId}').onCreate(
    async (snapshot) => {
        // Notification details.
        const text = snapshot.data().body;
        const payload = {
            notification: {
                title: `${snapshot.data().sender} sent ${text ? 'a message' : 'an image'}`,
                body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
                icon: 'https://firebasestorage.googleapis.com/v0/b/groot-a1013.appspot.com/o/appPushIcon.png?alt=media&token=44f65167-02f3-447e-8417-49f352945508' || 'https://firebasestorage.googleapis.com/v0/b/groot-a1013.appspot.com/o/appIcon.png?alt=media&token=6bf7bdc5-c695-4a3f-9976-2ddeae35747f',
                //icon: snapshot.data().profilePicUrl || '/images/profile_placeholder.png',
                click_action: `https://${process.env.GCLOUD_PROJECT}.web.app`,
            }
        };

        // Get the list of device tokens.
        const allTokens = await admin.firestore().collection('fcmTokens').get();
        const tokens = [];
        allTokens.forEach((tokenDoc) => {
            tokens.push(tokenDoc.id);
        });

        if (tokens.length > 0) {
            // Send notifications to all tokens.
            const response = await admin.messaging().sendToDevice(tokens, payload);
            await cleanupTokens(response, tokens);
            console.log('Notifications have been sent and tokens cleaned up.');
        }
    });

// Cleans up the tokens that are no longer valid.
function cleanupTokens(response, tokens) {
    // For each notification we check if there was an error.
    const tokensDelete = [];
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            // Cleanup the tokens who are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                const deleteTask = admin.firestore().collection('messages').doc(tokens[index]).delete();
                tokensDelete.push(deleteTask);
            }
        }
    });
    return Promise.all(tokensDelete);
}