const usersList = $('#usersList');
const thumbnailBgColors = ['orange', 'red', 'green', 'blue', 'purple', 'pink', 'black', 'darkblue'];
const conversationThumbnail = $('.conversation-thumbnail');
const conversationName = $('.conversation-name');
const conversationBio = $('.conversation-bio');
const messageTextInput = $('.message-text-input');
const sendTextMessageBtn = $('.send-text-message');
const msgBody = $('.msg-body>ul');
var conversationRef;

const preloader = document.querySelector('#preloader');
if (preloader) {
    window.addEventListener('load', () => {
        preloader.remove();
    });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, push, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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
        $('#login').addClass('d-none');
        $('#chat').removeClass('d-none');
        getUsersList().then((users) => {
            usersList.html('');
            Object.keys(users).forEach((key) => {
                let color = thumbnailBgColors[Math.floor(Math.random() * thumbnailBgColors.length)];
                usersList.append(`
                    <a href="#" class="d-flex align-items-center open-conversation" data-uid="${users[key].uid}">
                        <div class="flex-shrink-0">
                            <img class="img-fluid user-thumbnail"
                                src="${users[key].photoURL}"
                                alt="user img" onerror="this.src='https://placehold.co/45x45/${color}/white?font=lora&text=${users[key].displayName.charAt(0)}'">
                            <span class="active"></span>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h3>${users[key].displayName}</h3>
                            <p>${users[key].email}</p>
                        </div>
                    </a>
                `);
            })
        })
    }
    else {
        $('#login').removeClass('d-none');
        $('#chat').addClass('d-none');
    };
}
open_chat();

$('body').on('click', '.open-conversation', async function (e) {
    e.preventDefault();
    let _this = $(this);
    let uid = $(this).data('uid');
    let sender = JSON.parse(window.localStorage.getItem('user')).uid;
    conversationThumbnail.attr('src', _this.find('img').attr('src'));
    conversationName.text(_this.find('h3').text());
    conversationBio.text('Some bio about ' + _this.find('h3').text() + '.');
    messageTextInput.data('uid', uid);
    // open_chat();
    const conversationRefPath1 = 'conversations/' + sender + '-' + uid;
    const conversationRefPath2 = 'conversations/' + uid + '-' + sender;

    let conversationSnapshot;
    try {
        // Check if the first conversation path exists
        conversationRef = ref(database, conversationRefPath1);
        conversationSnapshot = await get(conversationRef);
        // If it does not exist, check the second path
        if (!conversationSnapshot.exists()) {
            conversationRef = ref(database, conversationRefPath2);
            conversationSnapshot = await get(conversationRef);
        }
    } catch (error) {
        console.error(error);
        alert('Something went wrong. Please try again later.');
    }
    conversationSnapshot = conversationSnapshot.val();
    // await loadMessages(sender, conversationSnapshot);
    // msgBody[0].scrollIntoView({ behavior: 'fast', block: 'end' }); 

    
    onValue(conversationRef, async (snapshot) => {
        const conversationSnapshot = snapshot.val();
        await loadMessages(sender, conversationSnapshot);
        msgBody[0].scrollIntoView({ behavior: 'instant', block: 'end' });
        //scroll ul to Bottom
        // msgBody.scrollTo(msgBody[0].scrollHeight);
    })
})

sendTextMessageBtn.on('click', async function (e) {
    e.preventDefault();

    const uid = messageTextInput.data('uid');
    const sender = JSON.parse(window.localStorage.getItem('user')).uid;
    const message = messageTextInput.val();

    // Define potential conversation references
    // const conversationRefPath1 = 'conversations/' + sender + '-' + uid;
    // const conversationRefPath2 = 'conversations/' + uid + '-' + sender;

    // let conversationRef;
    let conversationRefPath;
    try {
        // Check if the first conversation path exists
        // conversationRef = ref(database, conversationRefPath1);
        // let conversationSnapshot = await get(conversationRef);
        // conversationRefPath = conversationRefPath1;
        // // If it does not exist, check the second path
        // if (!conversationSnapshot.exists()) {
        //     conversationRef = ref(database, conversationRefPath2);
        //     conversationRefPath = conversationRefPath2;
        // }

        var conversationRefKey = push(child(conversationRef, 'conversations')).key;
        // conversationRef = ref(database, conversationRefPath + '/' + conversationRefKey);

        set(child(conversationRef, '/' + conversationRefKey) , {
            sender: uid,
            message: message,
            timestamp: Date.now()
        })
        .then(() => {
            console.log('message sent');
        })
        .catch((error) => {
            alert('Something went wrong. Please try again later.');
        });
        messageTextInput.val(''); // Clear the input field
    } catch (error) {
        console.error(error);
        alert('Something went wrong. Please try again later.');
    }
});


// sendTextMessageBtn.on('click',async function(e){
//     e.preventDefault();
//     let uid = messageTextInput.data('uid');
//     let sender = JSON.parse(window.localStorage.getItem('user')).uid;
//     let message = messageTextInput.val();

//     let conversationRef = ref(database, 'conversations/' + sender + '-' + uid);
//     var conversationSnapshot = await get(conversationRef);
//     if (conversationSnapshot.exists()) {
//         conversationRef = 'conversations/' + sender + '-' + uid;
//     }
//     else{
//         conversationRef = 'conversations/' + sender + '-' + uid;
//     }

//     if (!conversationSnapshot.exists()) {
//         conversationRef = ref(database, 'conversations/' + sender + '-' + uid);
//         var conversationRefKey = push(child(conversationRef, 'conversations')).key;
//     }
//     else{
//         var conversationRefKey = push(child(conversationRef, 'conversations')).key;
//         conversationRef = ref(database, 'conversations/' + sender + '-' + uid + '/' + conversationRefKey);
//     }


//     set(conversationRef, {
//         sender: uid,
//         message: message
//     })
//     .then(() => {
//         console.log('message sent');
//     })
//     .catch((error) => {
//         alert('Something went wrong. Please try again later.');
//     });
//     // let key = 
//     // console.log(key);
//         // conversationRef.push({
//         //     uid: uid,
//         //     message: message
//         // })
//         // set(conversationRef, {
//         //     uid: uid,
//         //     message: message
//         // })
//         // .then(() => {
//         //     console.log('message sent');
//         // })
//         // .catch((error) => {
//         //     alert('Something went wrong. Please try again later.');
//         // });
//     // messageTextInput.val('');

//     // const conversationRef = ref(database, 'conversations');
//     // const conversationSnapshot = await get(conversationRef);
//     // if (conversationSnapshot.exists()) {
//     //     console.log(conversationSnapshot.val());
//     // }

// })


$('body').on('click', '#sign-out', function (e) {
    e.preventDefault();
    window.localStorage.removeItem('user');
    window.location.reload();
})






async function getUsersList() {
    const userRef = ref(database, 'users');
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
        return userSnapshot.val();
    }
}



async function loadMessages(sender, conversationSnapshot) {
    $.each(conversationSnapshot, (index, val) => {
        console.log({ index, val })
        let className = (val.sender === sender) ? 'sender' : 'repaly';
        let message = val.message;
        msgBody.append(`<li class="${className}">
                            <p>${message}</p>
                            <span class="time">10:35 am</span>
                        </li>`);
    })
}


