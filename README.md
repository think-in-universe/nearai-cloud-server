# NEAR AI Cloud Server
NEAR AI Cloud Server

## Download dependencies
```shell
pnpm install
```

## Config environment
Create [.env.local](.env.local) and [.env.dev](.env.dev) files by referring to [.env.example](.env.example)

File [.env.local](.env.local):
```
ENV=dev
```

File [.env.dev](.env.dev):
```
# Supabase
SUPABASE_API_URL=
SUPABASE_ANON_KEY=

# Litellm
LITELLM_API_URL=
LITELLM_ADMIN_KEY=
LITELLM_SIGNING_KEY=
LITELLM_DB_URL=

## Litellm database migrations
LITELLM_DB_DIRECT_URL=

# NEAR AI Cloud
NEAR_AI_CLOUD_DB_URL=

## NEAR AI Cloud database migrations
NEAR_AI_CLOUD_DB_DIRECT_URL=

# Server
PORT=

# Slack
SLACK_WEBHOOK_URL=
```

The [.env.local](.env.local) file determines which environment to use, and [.env.dev](.env.dev) defines the related environment variables.
Similarly, you can create [.env.stg](.env.stg) and [.env.prd](.env.prd); you just need to edit the [.env.local](.env.local) to switch environments

## Development Start
Generate additional code. The code is located in the [.prisma/generated](.prisma/generated) folder
```shell
pnpm generate:all
```

Run the project
```shell
pnpm preview
```

## Production Start
Build the project, including the generation of additional code
```shell
pnpm build
```

Run the project
```shell
pnpm start
```

## Migrations
This project uses two databases: the LiteLLM database and the NEAR AI Cloud database.
We use Prisma ORM to connect with these databases

### LiteLLM
If you need update the schema of LiteLLM, run command:
```shell
make migrations/litellm/pull
```

This command will automatically pull the latest schema used by LiteLLM, so you don't need to edit it

The LiteLLM schema is managed by LiteLLM itself, and in this project, no additional migrations are needed

### NEAR AI Cloud
The migration step is:
1. Make sure you are in `dev` environment
2. Migrate in `dev`
    ```shell
    make migrations/nearai-cloud/dev
    ```
   This command will compare the differences between your `dev` database schema and the Prisma schema file, then create a new migration history file in [.prisma/migrations](.prisma/migrations) folder and deploy it to your `dev` database

Now your `dev` database is synced

Don't forget to commit the new migration history file!

For `stg` and `prd` environment, the new migration history will automatically apply when you run the project
