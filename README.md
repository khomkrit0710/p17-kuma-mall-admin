## Getting Started

```bash

//setup Postgres Database and pgAdmin4 Tools 
docker-compose up -d

//Get .env from repo owner
put .env in the root of file (same level with package.json & prisma folder)

//Register new server in localhost:5050 in any browser along with .env (ask repo owner)

//install library (install dependency)
npm install

//run script to init sql file in prisma
npx prisma migrate dev --name init

//start
npm run dev

```

## command check err for deploy

```bash
//check deploy
npm run build

//delete cache for reset
next : Remove-Item -Path .next -Recurse -Force

```