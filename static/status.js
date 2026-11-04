const socket = io();
let versions = {}
// online icon:
socket.on("connect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "green");
});

socket.on("disconnect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "red");
});

socket.on('init', function (payload) {
    const table = document.getElementById('table').getElementsByTagName('tbody')[0];
    table.innerHTML = ""
    payload.forEach(event => {
        versions[event.number] = event.version

        const row = table.insertRow()
        const number = row.insertCell()
        const name = row.insertCell()
        number.textContent = event.number
        name.textContent = event.name

        valueNames = ["official", "printed"]
        for (const key in event) {
            if (!valueNames.includes(key)) continue
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
            const cell = row.insertCell()
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
})

socket.on('error', function (payload) {
    alert(payload.message)
    console.log(payload.message)
})

function addWk() {
    document.getElementById("add-wk-dialog").showModal();
}

function sendWK() {
    const dialog = document.getElementById("add-wk-dialog");
    console.log(document.getElementById("wk-number").value);
    dialog.close();
}
