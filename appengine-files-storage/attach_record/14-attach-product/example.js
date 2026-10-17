const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/update-partial/sf_product/6ac99bdff5d6b011f6e10eeb";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "data.images": [
    {
      "path": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png",
      "url": "https://fundu-space-sfo3-dev.sfo3.digitaloceanspaces.com/video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
    }
  ]
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
