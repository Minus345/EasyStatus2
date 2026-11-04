import os
import sqlite3

import socketio
from flask import Flask, render_template
from flask import blueprints
from flask_socketio import SocketIO, emit

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
def update_checkbox(data):
    print('received message: ' + str(data))
    # translate bool
    bool_value = 0
    if data['value']:
        bool_value = 1

    # prevent sql-injection for collum
    collum_Names = ["official", "printed", "certificate"]
    if data['type'] not in collum_Names:
        raise ValueError("Invalid collum")

    con = db.get_db()
    try:
        with con:
            cur = con.cursor()
            sql = f"UPDATE event SET {data['type']} = ?, version = ? WHERE number = ? AND version = ?"  # ? operator is not allowed in keys
            result_transaction = cur.execute(sql, (bool_value, data['version'] + 1, data['number'], data['version']))

            if result_transaction.rowcount == 0:
                # Failure:
                db.close_db()
                emit('error',{"message": "Optimistic Locking Error: Your Browser is probably outdated. It will be refreshed"})
                emit_init()
                raise ValueError("Optimistic Locking Error")
    except sqlite3.Error as e:
        db.close_db()
        emit('error', {"message": "Database Error: Your browser will be refreshed. Then try again"})
        emit_init()
        raise e

    # Success:
    data['version'] = data['version'] + 1
    emit('update', data, broadcast=True)
    db.close_db()


@socketio.on('connect')
def init_client():
    emit_init()

def emit_init():
    emit('init', query_db("SELECT * FROM event"))

def query_db(query):
    # source: https://stackoverflow.com/questions/3286525/return-sql-table-as-json-in-python
    cur = db.get_db().cursor()
    cur.execute(query)
    r = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
    return r


if __name__ == '__main__':
    app = create_app()
    socketio.run()
