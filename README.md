This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker Compose

Copie `.env.example` para `.env` e defina senhas fortes para `MYSQL_ROOT_PASSWORD` e `DB_PASSWORD`.

Se já houver um MySQL do BatePonto em execução na rede `bateponto-network`, inicie a API e a interface sem criar outro banco:

```bash
docker compose up --build -d
```

Para uma instalação nova, sem banco existente na rede, inicie também o MySQL incluído:

```bash
docker compose --profile database up --build -d
```

Não inicie o perfil `database` se outro MySQL já estiver usando o volume `mysql_data`. Acesse [http://localhost:8080](http://localhost:8080) ou [http://localhost:3000](http://localhost:3000); ambos apontam para a mesma interface atual. O Compose constrói a API e a interface a partir do código deste repositório; somente a interface é publicada na máquina hospedeira. Gestores podem abrir **Folha de Ponto** para consultar, imprimir ou salvar em PDF os registros mensais dos funcionários. Em uma instalação nova, o banco é inicializado com as tabelas do sistema e o usuário inicial `rh@instituicao.sp.gov.br` (senha `987654`). Altere essa senha antes de usar o sistema em produção.

Se as portas padrão já estiverem ocupadas, altere `APP_PORT` e `APP_ALT_PORT` no arquivo `.env` para portas disponíveis.

Os dados do MySQL ficam no volume `mysql_data`. Os scripts em `database.sql` só são executados quando esse volume é criado pela primeira vez. Para parar os serviços, use `docker compose down`; para apagar também o banco persistido, use `docker compose down -v`.

Cada push de alterações da aplicação para `main` publica automaticamente as imagens no GitHub Container Registry:

```text
ghcr.io/milenamitie/bateponto-backend:latest
ghcr.io/milenamitie/bateponto-frontend:latest
```

Após a primeira publicação, defina os pacotes `bateponto-backend` e `bateponto-frontend` como públicos nas configurações de cada pacote no GitHub para permitir downloads sem autenticação. Para baixar as imagens e atualizar a interface e a API sem recriar o banco:

```bash
docker compose pull backend-bateponto frontend-bateponto
docker compose up -d --no-build backend-bateponto frontend-bateponto
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
