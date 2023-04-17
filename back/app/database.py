from peewee import *

db = SqliteDatabase('people.db')

class User(Model):
    email = CharField(unique=True)
    name = CharField()
    adresse = CharField()


    class Meta:
        database = db

db.connect()

