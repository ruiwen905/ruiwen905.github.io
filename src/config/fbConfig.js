import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

// Replace this with your own config details
var config = {
  apiKey: "AIzaSyCnkHVNDConsZ8kDOnP5h2FOytxAeMy5H4",
  authDomain: "portfolio-55086.firebaseapp.com",
  databaseURL: "https://portfolio-55086.firebaseio.com",
  projectId: "portfolio-55086",
  storageBucket: "portfolio-55086.appspot.com",
  messagingSenderId: "47207945380"
};
firebase.initializeApp(config);
firebase.firestore().settings({ timestampsInSnapshots: true });

export default firebase
