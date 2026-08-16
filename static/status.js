const socket = io();
socket.on('init', function (payload) {
    console.log(payload);
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
                socket.emit('checkbox', {"event": event.number, "type": key, "value": checkbox.checked});
            }
            const cell = row.insertCell()
            cell.appendChild(checkbox)
            checkboxes.push(cell)
        }


    })
})

