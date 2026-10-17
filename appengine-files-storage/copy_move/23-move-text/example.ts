const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/move";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "src": "course-files-1009/work/supplier-notes-copy.txt",
  "dest": "course-files-1009/work/supplier-notes-moved.txt"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
