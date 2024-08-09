import logging
from typing import Optional

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from back.env import ENV

database: Optional[AsyncIOMotorDatabase] = None
db_client: Optional[AsyncIOMotorClient] = None


@Depends
def get_db() -> AsyncIOMotorDatabase:
    if database is None:
        raise ValueError('Database is not connected.')

    return database


def init_db():
    logging.info('Connecting to mongo...')
    global database, db_client
    db_client = AsyncIOMotorClient(ENV.db_uri)
    database = db_client.get_database(ENV.db_name)
    logging.info('Connected to mongo.')


def close_db():
    logging.info('Closing connection to mongo...')
    global db_client
    if db_client is not None:
        db_client.close()
    logging.info('Mongo connection closed.')
