/* ---------- FIREBASE ---------- */
firebase.initializeApp({
  apiKey: "AIzaSyAI5nA49KkR5VsPn3QpjWOdM0lv2nEQu3U",
  authDomain: "private-chat-app-2986d.firebaseapp.com",
  projectId: "private-chat-app-2986d"
});
var db = firebase.firestore();

/* ---------- SIMPLE USER ID (TEMP) ---------- */
var myCode = localStorage.getItem("myCode");
if (!myCode) {
  myCode = "U-" + Math.random().toString(36).substr(2,5);
  localStorage.setItem("myCode", myCode);
}

/* ---------- DOM ---------- */
var chatListEl = document.getElementById("chatList");
var chatBoxEl  = document.getElementById("chatBox");
var chatUserEl = document.getElementById("chatUser");
var msgInputEl = document.getElementById("msgInput");

/* ---------- GLOBAL ---------- */
var chatId = null;

/* ================= HOME PAGE ================= */
if (chatListEl) {

  // 🔥 REALTIME CHAT LIST
  db.collection("chats")
    .where("users", "array-contains", myCode)
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      chatListEl.innerHTML = "";

      snap.forEach(doc => {
        var data = doc.data();
        var other = data.users.find(u => u !== myCode);

        var div = document.createElement("div");
        div.className = "chat-card";
        div.innerHTML = `<b>${other}</b><p>${data.last || ""}</p>`;

        div.onclick = () => {
          location.href = "chat.html?c=" + doc.id;
        };

        chatListEl.appendChild(div);
      });
    });
}

/* ---------- START NEW CHAT ---------- */
function newChat() {
  var other = prompt("Enter any code");
  if (!other) return;

  var id = [myCode, other].sort().join("__");

  db.collection("chats").doc(id).set({
    users: [myCode, other],
    last: "",
    time: Date.now()
  });

  location.href = "chat.html?c=" + id;
}

/* ================= CHAT PAGE ================= */
if (chatBoxEl && chatUserEl) {

  var params = new URLSearchParams(location.search);
  chatId = params.get("c");
  if (!chatId) location.href = "index.html";

  var parts = chatId.split("__");
  chatUserEl.innerText = parts[0] === myCode ? parts[1] : parts[0];

  // 🔥 REALTIME MESSAGES
  db.collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("time")
    .onSnapshot(snap => {
      chatBoxEl.innerHTML = "";

      snap.forEach(d => {
        var m = d.data();
        var div = document.createElement("div");
        div.className = "msg " + (m.from === myCode ? "me" : "them");
        div.innerText = m.text;
        chatBoxEl.appendChild(div);
      });

      chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    });
}

/* ---------- SEND MESSAGE ---------- */
function sendMsg() {
  if (!chatId || !msgInputEl.value) return;

  db.collection("chats")
    .doc(chatId)
    .collection("messages")
    .add({
      from: myCode,
      text: msgInputEl.value,
      time: Date.now()
    });

  db.collection("chats")
    .doc(chatId)
    .set({
      last: msgInputEl.value,
      time: Date.now()
    }, { merge: true });

  msgInputEl.value = "";
}

function goHome() {
  location.href = "index.html";
}
