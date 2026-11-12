const socket = io();
let versions = {};
let notification_enabled = false;
let notification_list = [];
// online icon:
socket.on("connect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "green");
});

socket.on("disconnect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "red");
});

socket.on('init', function (payload) {
    console.log(payload)

    Notification.requestPermission((result) => {
        if (result === "granted") {
            notification_enabled = true;
        } else {
            notification_enabled = false;
        }
    });

    //clear everything bevor
    const table_head = document.getElementById('table').getElementsByTagName('thead')[0];
    table_head.innerHTML = "";
    const table_body = document.getElementById('table').getElementsByTagName('tbody')[0];
    table_body.innerHTML = "";

    const header = payload.header;
    const body = payload.body;
    const static_cells = ["version", "number", "name"];

    // create table head:
    // static members:
    const row_head = table_head.insertRow();
    const number_head = row_head.insertCell();
    number_head.textContent = "WK-Nummer";
    const name_head = row_head.insertCell();
    name_head.textContent = "Strecke";

    // dynamic checkboxes
    header.forEach(entry => {
        if (static_cells.includes(entry)) return;
        const cell_head = row_head.insertCell();
        cell_head.textContent = entry;
    })

    // fill table body
    body.forEach(event => {
        versions[event.number] = event.version;

        const row_body = table_body.insertRow();
        const number = row_body.insertCell();
        number.textContent = event.number;
        const name = row_body.insertCell();

        name.textContent = event.name;
        for (const key in event) {
            if (static_cells.includes(key)) continue
            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = event[key] === 1
            checkbox.id = event.number + " " + key
            checkbox.onchange = function () {
                socket.emit('checkbox', {
                    "number": event.number,
                    "type": key,
                    "value": checkbox.checked,
                    "version": versions[event.number]
                });
            }
            const cell = row_body.insertCell()
            cell.appendChild(checkbox)
        }
    })
})

socket.on('update', function (payload) {
    const curVersion = versions[payload.number] || 0
    if (curVersion >= payload.version) return // old packet received -> discard
    versions[payload.number] = payload.version
    const checkbox = document.getElementById(payload.number + " " + payload.type);
    checkbox.checked = payload.value
    if (notification_enabled && document.visibilityState === "hidden") {
        sendNotification(payload.number, payload.type, payload.value);
    }
})

socket.on('error', function (payload) {
    alert(payload.message)
    console.log(payload.message)
})

function addWk() {
    document.getElementById("add-wk-dialog").showModal();
}

function sendAddWK() {
    const dialog = document.getElementById("add-wk-dialog");
    const wkNumber = document.getElementById("wk-number-add").value;
    if (wkNumber === "") {
        alert("Bitte mindesten eine WK-Nummer angeben");
        return;
    }
    socket.emit('addWK', {
        "number": wkNumber,
        "name": document.getElementById("wk-name-add").value,
    });
    dialog.close();
}

function rmWk() {
    document.getElementById("rm-wk-dialog").showModal();
}

function sendRmWK() {
    const dialog = document.getElementById("rm-wk-dialog");
    const wkNumber = document.getElementById("wk-number-rm").value;
    if (wkNumber === "") {
        alert("Bitte eine WK-Nummer angeben");
        return;
    }
    let result = confirm("Soll der WK: " + wkNumber + " wirklich gelöscht werden?")
    if (!result) {
        return;
    }
    socket.emit('rmWK', {
        "number": wkNumber
    });
    dialog.close();
}

function sendNotification(number, key, value) {
    const img = "/static/Icon.png";
    let check_mark;
    if (value) {
        check_mark = "🗹 (erledigt)";
    } else {
        check_mark = "zurückgesetzt";
    }
    const text = `WK-Nummer: ${number} : ${key} jetzt ${check_mark}`;
    const notification = new Notification("Easy Status", {body: text, icon: img});
    notification_list.push(notification);
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        // The tab has become visible so clear the now-stale Notification.
        notification_list.forEach(elem => {
            elem.close();
        })
    }
});