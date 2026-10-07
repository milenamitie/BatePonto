This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker Compose

Copie `.env.example` para `.env` e defina senhas fortes para `MYSQL_ROOT_PASSWORD` e `DB_PASSWORD`. Em seguida, inicie os três serviços:

```bash
docker compose up --build -d
```

Acesse [http://localhost:8080](http://localhost:8080). O Compose inicia o MySQL, a API e a interface na rede privada `bateponto-network`; somente a interface é publicada na máquina hospedeira. O banco é inicializado na primeira execução com as tabelas do sistema e o usuário inicial `rh@instituicao.sp.gov.br` (senha `987654`). Altere essa senha antes de usar o sistema em produção.

Os dados do MySQL ficam no volume `mysql_data`. Os scripts em `database.sql` só são executados quando esse volume é criado pela primeira vez. Para parar os serviços, use `docker compose down`; para apagar também o banco persistido, use `docker compose down -v`.

Para publicar as três imagens no Docker Hub, autentique-se e construa os repositórios definidos no Compose:

```bash
docker login
docker build -f database.Dockerfile -t milenamitie/mysql-bateponto:latest .
docker build -f backend/Dockerfile -t milenamitie/backend-bateponto:latest backend
docker build -f dockerfile --build-arg API_INTERNAL_URL=http://backend-bateponto:3000 -t milenamitie/frontend-bateponto:latest .
docker push milenamitie/mysql-bateponto:latest
docker push milenamitie/backend-bateponto:latest
docker push milenamitie/frontend-bateponto:latest
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
