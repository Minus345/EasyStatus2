import os

import socketio
from flask import Flask, render_template
from flask import blueprints
from flask_socketio import SocketIO
from flask import jsonify

import db

socketio = SocketIO()
bp_main = blueprints.Blueprint('main', __name__)


def create_app():
    app = Flask(__name__)
    # configure app
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )
    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    # init db
    db.init_app(app)
    app.register_blueprint(bp_main)
    # init websocket
    socketio.init_app(app)
    return app


@bp_main.route('/')
def init():
    return render_template('status.html')


@socketio.on('checkbox')
def handle_message(data):
    print('received message: ' + str(data))


@socketio.on('connect')
def init_client():
    socketio.emit('init', query_db("SELECT * FROM event"))


def query_db(query):
    # source: https://stackoverflow.com/questions/3286525/return-sql-table-as-json-in-python
    cur = db.get_db().cursor()
    cur.execute(query)
    r = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
    return r


if __name__ == '__main__':
    app = create_app()
    socketio.run()
