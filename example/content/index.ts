import child from "./components/child"
import parent from "./components/parent"

child()
parent()
console.log('THIS CONTENT');

const com = document.createElement("wb-parent");
document.body.appendChild(com);