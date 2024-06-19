# Kanes Furniture

## Installation
> **Note:** This project uses Node.js (version - v18.14.0 or higher).

To install the project, follow these steps:
- Clone the repository to your local machine using `git clone https://github.com/Arteta-LLC/d2c-shopify-kanes-theme-us-theme-2.0.git`.
- Navigate to the project directory using `cd d2c-shopify-kanes-theme-us-theme-2.0` command or open folder in Editor.
- Install the project dependencies using `npm install` command.
- create config file in your directory using `password`, `theme_id` and `store` name.

### Run Project
> **Note:**  If you want to work in developmen environment, go to "Customizer" -> "Theme settings" -> "Environment" (choose your environment) (default value is 'Production').

To run the project, follow these steps:
- Run theme kit using command `theme watch --env={development}` (development) is the name of theme settings in .yml file.
- Run the dev server using (`yarn run dev`, `npm run dev`) choose one or (`yarn run build`, `npm run build`) choose one if you need build source files.
- change file to check if everything updating.

### Shopify Theme Check
To run the CLI, follow these steps:
- Run `shopify auth logout`
- Run `shopify auth shopify theme dev --store my-store kanes-furniture.myshopify.com`
- Setup your shopify.theme.toml `https://shopify.dev/docs/themes/tools/cli/environments`
- Run `shopify theme dev --environment YOUR_ENV`
- Run `shopify theme check --init` to generate a theme check file `theme-check.yml`if you haven't already
- Run `shopify theme check`