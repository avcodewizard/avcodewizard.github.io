const preloader = document.querySelector('#preloader');
if (preloader) {
  window.addEventListener('load', () => {
    preloader.remove();
  });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAOgC8M2o5Wz8yl3f1wGQ8p_rUWXujckpw",
    authDomain: "livechattest-39175.firebaseapp.com",
    databaseURL: "https://livechattest-39175-default-rtdb.firebaseio.com",
    projectId: "livechattest-39175",
    storageBucket: "livechattest-39175.appspot.com",
    messagingSenderId: "790569864878",
    appId: "1:790569864878:web:8d3fa30563adfdbaaaa73f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
auth.languageCode = 'it';
$('#sign-in-button').click(() => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            getOrCreateUser(user, token);
        })
        .catch((error) => {
            alert('Something went wrong. Please try again later.');
            window.location.reload();
        });
})


async function getOrCreateUser(user, token) {
    const userRef = ref(database, 'users/' + user.uid);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
        set(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid,
            token: token
        })
            .then(() => {
                loginUser({
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid
                });
            })
            .catch((error) => {
                alert('Something went wrong. Please try again later.');
                window.location.reload();
            });
    } else {
        loginUser(userSnapshot.val());
    }
}

function loginUser(user) {
    window.localStorage.setItem('user', JSON.stringify(user));
    open_chat();
}

function open_chat() {
    if (window.localStorage.getItem('user')) {
        alert('You are ready to start chatting with me.');
        $('#login').addClass('d-none');
        $('#chat').removeClass('d-none');
    }
    else {
        alert('Please login first.');
        $('#login').removeClass('d-none');
        $('#chat').addClass('d-none');
    };
}
open_chat();