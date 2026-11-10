import os
import sqlite3
from typing import Any

import socketio
from flask import Flask, render_template
from flask import blueprints
from flask import current_app as app
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
    # translate bool
    bool_value = 0
    if data['value']:
        bool_value = 1

    # prevent sql-injection for collum
    if data['type'] not in db.column_Names:
        raise ValueError("Invalid collum: " + str(data))

    con = db.get_db()
    try:
        with con:
            cur = con.cursor()
            sql = f"UPDATE event SET {data['type']} = ?, version = ? WHERE number = ? AND version = ?"  # ? operator is not allowed in keys
            result_transaction = cur.execute(sql, (bool_value, data['version'] + 1, data['number'], data['version']))

            if result_transaction.rowcount == 0:
                # Failure:
                db.close_db()
                emit('error', {
                    "message": "Optimistic Locking Error: Your Browser is probably outdated. It will be refreshed"})
                emit_init()
                app.logger.error("Optimistic Locking Error: Your Browser is probably outdated.")
    except sqlite3.Error as e:
        db.close_db()
        emit('error', {"message": "Database Error: Your browser will be refreshed. Then try again"})
        emit_init()
        app.logger.exception(e)

    # Success:
    data['version'] = data['version'] + 1
    emit('update', data, broadcast=True)
    db.close_db()


@socketio.on('connect')
def init_client():
    emit_init()


@socketio.on('addWK')
def addWK(data):
    execute_query_with_emit_init("INSERT INTO event (number, name) VALUES (?,?)", (data['number'], data['name']))


@socketio.on('rmWK')
def rmWK(data):
    execute_query_with_emit_init("DELETE FROM event WHERE number = ?", (data['number'],))


def emit_init(broadcast: bool = False):
    emit('init', query_db("SELECT * FROM event"), broadcast=broadcast)


def query_db(query: str) -> dict[str, list[Any] | list[dict[Any, Any]]]:
    '''
    Returns "json" object
    :param query:
    :return:
    Message: {"header" : header, "body" : body}
        - header: (int , collum Name)
        - body: {collum Name : value} for all columns
    '''
    # source: https://stackoverflow.com/questions/3286525/return-sql-table-as-json-in-python
    cur = db.get_db().cursor()
    cur.execute(query)
    sql_table_as_jason = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
    header = [cur.description[i][0] for i in range(len(cur.description))]
    return {"header": header, "body": sql_table_as_jason}


def execute_query_with_emit_init(query: str, var):
    con = db.get_db()
    try:
        with con:
            cur = con.cursor()
            cur.execute(query, var)
            con.commit()
    except sqlite3.Error as e:
        db.close_db()
        emit('error', {"message": "Database Error: " + str(e)})
        app.logger.exception(e)
    emit_init(broadcast=True)
    db.close_db()


if __name__ == '__main__':
    app = create_app()
    socketio.run()
