# Bakery Inventory Backend — MySQL Setup

## 1) Install dependencies

### Local (venv)
```powershell
.\.venv\Scripts\python -m pip install -r requirements.txt
```

### Windows note
This project uses `mysqlclient` (Django’s recommended MySQL driver). On Windows, it is typically installed via a prebuilt wheel; if pip attempts to compile, install Microsoft C++ Build Tools.

### Docker
Build uses `mysqlclient`, which requires system headers. The `Dockerfile` installs `default-libmysqlclient-dev`.

## 2) Environment variables

Copy `.env.example` to `.env` and edit:

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

Django loads `.env` and then `.env.local` (optional) which overrides.

## 3) Create the MySQL database

### Create DB + user (example)
```sql
CREATE DATABASE bakery_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'bakery'@'%' IDENTIFIED BY 'bakery_password';
GRANT ALL PRIVILEGES ON bakery_inventory.* TO 'bakery'@'%';
FLUSH PRIVILEGES;
```

Set in `.env`:
```env
DB_NAME=bakery_inventory
DB_USER=bakery
DB_PASSWORD=bakery_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

## 4) Run migrations
```powershell
.\.venv\Scripts\python manage.py migrate
```

## 5) Sanity-check the DB
```powershell
.\.venv\Scripts\python manage.py validate_db
```

## 6) RBAC groups + Celery Beat schedules
```powershell
.\.venv\Scripts\python manage.py bootstrap_rbac
.\.venv\Scripts\python manage.py bootstrap_celery_beat
```

## 7) Running the server
```powershell
.\.venv\Scripts\python manage.py runserver
```

## 8) Safe migration from SQLite -> MySQL (if you have existing data)

### Recommended approach: dumpdata/loaddata

1. **Back up** your SQLite DB file.
2. Point settings back to SQLite temporarily by creating/updating `.env.local` (it overrides `.env`):

```env
DB_NAME=
DATABASE_URL=sqlite:///db.sqlite3
```

Then:

```powershell
.\.venv\Scripts\python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.permission --indent 2 > data.json
```

3. Switch env back to MySQL (`DB_NAME` set, etc.).

For example, remove the SQLite overrides from `.env.local` (or delete `.env.local`) so `.env` MySQL settings are used again.
4. Run migrations on MySQL:

```powershell
.\.venv\Scripts\python manage.py migrate
```

5. Load the data:

```powershell
.\.venv\Scripts\python manage.py loaddata data.json
```

### Notes
- This is the safest general-purpose approach for Django projects.
- If you have very large datasets, use a dedicated ETL process instead.
