  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyDnuh27yGBslgnJ8Qbc0Blp5q24rnxfDB0",
    authDomain: "groot-a1013.firebaseapp.com",
    databaseURL: "https://groot-a1013.firebaseio.com",
    projectId: "groot-a1013",
    storageBucket: "groot-a1013.appspot.com",
    messagingSenderId: "1068207603812",
    appId: "1:1068207603812:web:ab1a6ee91173d202f81f71"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();
  const functions = firebase.functions();
  var storage = firebase.storage();
  var rdb = firebase.database();