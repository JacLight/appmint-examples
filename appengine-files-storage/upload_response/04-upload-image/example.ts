const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN};
import {readFile} from "node:fs/promises";
const filename = process.env.FILE || "cedar-botanical-print.png";
const selectedFile = new File([await readFile(filename)], filename.split("/").pop());
const location = "course-files-1009";
const isPrivate = "false";
const form: FormData = new FormData();
form.set("file", selectedFile);
form.set("location", location);
form.set("isPrivate", isPrivate);
const response = await fetch(base + route, {
  method: "POST", headers, body: form
});
console.log(await response.json());
