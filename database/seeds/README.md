# Development data

Use npm --prefix server run seed with NODE_ENV=development and SEED_PASSWORD set to a password of at least eight characters containing a number. This generates valid bcrypt hashes for student@demo.example and faculty@demo.example and creates one demo classroom. Existing accounts are preserved. There is no hard-coded default password.
