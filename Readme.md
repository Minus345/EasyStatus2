# Easy Status 2
This is a webserver in flask for managing swimming events. It displays the currant events and there status.
It's synchronized via websocket between the connected clients.

## Start
`gunicorn -c gunicorn.conf.py `

First startup you have to init the db:  
`flask init-db `

## Install
https://flask-socketio.readthedocs.io/en/latest/deployment.html

`python -m venv .venv`  
`source .venv/bin/activate`  
`pip install -r requirements.txt`