#!/usr/bin/env python3
"""
Seed script: inserts 10 employees into the RUKN Energy tenant schema.
Uses psycopg2 directly — run with:
  python3 scripts/seed-employees.py
"""
import os, sys, uuid
import psycopg2

# ── Resolve DB URL ──────────────────────────────────────────────────────────
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("ERROR: DATABASE_URL env not set")
    sys.exit(1)

# ── Tenant schema name ───────────────────────────────────────────────────────
TENANT_SCHEMA = "rukn_energy_services"

# ── Helper: connection with search_path set ───────────────────────────────────
def make_conn(url: str):
    # Use connection options to set search_path at connection level
    return psycopg2.connect(url, options=f"-c search_path={TENANT_SCHEMA}")

print(f"Connecting (schema={TENANT_SCHEMA}) ...")
conn = make_conn(db_url)
conn.autocommit = True
cur = conn.cursor()

# ── Check existing employees ─────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM employees")
existing = cur.fetchone()[0]
print(f"Employees already in schema: {existing}")
if existing >= 10:
    print("10+ employees already exist — skipping insert.")
    sys.exit(0)

# ── Insert departments (needed for FK) ────────────────────────────────────────
DEPT_IDS = {}
for dname in ["Executive", "Engineering", "Human Resources", "Finance", "Operations"]:
    cur.execute("SELECT id FROM departments WHERE name = %s", (dname,))
    row = cur.fetchone()
    if row:
        DEPT_IDS[dname] = row[0]
        print(f"  dept '{dname}' exists: {DEPT_IDS[dname]}")
    else:
        new_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO departments (id, name) VALUES (%s, %s)",
            (new_id, dname)
        )
        DEPT_IDS[dname] = new_id
        print(f"  dept '{dname}' created: {new_id}")

# ── Employee seed data ────────────────────────────────────────────────────────
# (fullName, nationality, dept_name, salary_basic, hire_date, occupation, status)
EMPLOYEES = [
    ("Khalid Abdulrahman Al-Otaibi",  "saudi",  "Engineering",       "18000", "2023-01-15", "Software Engineer",      "active"),
    ("Fatima Hassan Al-Zahrani",     "saudi",  "Human Resources",   "15500", "2023-03-01", "HR Specialist",           "active"),
    ("Ahmed Abdullah Al-Rashid",     "expat",  "Finance",           "22000", "2022-11-10", "Financial Analyst",        "active"),
    ("Sara Mohammed Al-Amri",        "saudi",  "Operations",        "12500", "2023-06-20", "Operations Coordinator",  "active"),
    ("Omar Farouk Al-Khatib",        "expat",  "Engineering",       "20000", "2021-09-01", "Tech Lead",               "active"),
    ("Noura Sulaiman Al-Harthi",     "saudi",  "Executive",         "35000", "2020-04-15", "Chief Executive Officer", "active"),
    ("Yousef Ibrahim Al-Shaikh",    "saudi",  "Finance",           "14500", "2023-08-01", "Accountant",              "active"),
    ("Reem Khalid Al-Mutairi",      "saudi",  "Human Resources",   "13000", "2023-09-15", "Recruitment Officer",     "active"),
    ("Hassan Naser Al-Ahmadi",      "expat",  "Engineering",       "16500", "2022-02-28", "Backend Developer",       "active"),
    ("Dana Faris Al-Jasem",          "saudi",  "Operations",        "11000", "2024-01-10", "Logistics Specialist",     "active"),
]

emp_ids = {}  # name → id

print("\nInserting employees ...")
for full_name, nationality, dept_name, salary, hire_date, occupation, status in EMPLOYEES:
    dept_id = DEPT_IDS[dept_name]
    emp_id  = str(uuid.uuid4())
    emp_ids[full_name] = emp_id

    cur.execute(
        """
        INSERT INTO employees (
            id, department_id, full_name, nationality,
            salary_basic, salary_housing, salary_transport,
            hire_date, occupation_code, employment_status,
            immigration_status, gosi_system
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (emp_id, dept_id, full_name, nationality,
         salary, str(float(salary) * 0.25), "2000",
         hire_date, occupation, status, "valid", "new")
    )
    print(f"  ✓ {full_name}")

# ── Wire managerEmployeeId (first 5 report to Noura Al-Harthi, CEO) ───────────
mgr_id = emp_ids["Noura Sulaiman Al-Harthi"]
for name in [
    "Khalid Abdulrahman Al-Otaibi",
    "Fatima Hassan Al-Zahrani",
    "Ahmed Abdullah Al-Rashid",
    "Sara Mohammed Al-Amri",
    "Omar Farouk Al-Khatib",
]:
    cur.execute(
        "UPDATE employees SET manager_employee_id = %s WHERE id = %s",
        (mgr_id, emp_ids[name])
    )
    print(f"  → {name} reports to Noura Al-Harthi")

# Omar reports to Khalid (Tech Lead relationship)
cur.execute(
    "UPDATE employees SET manager_employee_id = %s WHERE id = %s",
    (emp_ids["Khalid Abdulrahman Al-Otaibi"], emp_ids["Omar Farouk Al-Khatib"])
)
print(f"  → Omar Al-Khatib reports to Khalid Al-Otaibi (tech lead)")

# ── Verify ────────────────────────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM employees")
total = cur.fetchone()[0]
print(f"\n✅ Total employees in schema '{TENANT_SCHEMA}': {total}")

cur.close()
conn.close()
