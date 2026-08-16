const socket = io();
// online icon:
socket.on("connect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "green");
});

socket.on("disconnect", () => {
    document.querySelector("#socket-status circle").setAttribute("fill", "red");
});

//init
socket.on('init', function (payload) {
    const table = document.getElementById('table');
    payload.forEach(event => {
        const row = table.insertRow()
        const number = row.insertCell()
        const name = row.insertCell()
        number.textContent = event.number
        name.textContent = event.name

        valueNames = ["official", "printed", "certificate"]
        const checkboxes = []
        for (const key in event) {
            if (!valueNames.includes(key)) continue
            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = event[key] === 1
            checkbox.id = event.number + " " + key
            checkbox.onchange = function () {
                socket.emit('checkbox', {"number": event.number, "type": key, "value": checkbox.checked});
            }
            const cell = row.insertCell()
            cell.appendChild(checkbox)
            checkboxes.push(cell)
        }
    })
})

socket.on('update', function (payload) {
    const checkbox = document.getElementById(payload.number + " " + payload.type);
    checkbox.checked = payload.value
})

