import { defineConfig, type Plugin } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";

const normalize = (path: string) => path.replace(/\\/g, "/");

const fileName = (path: string) =>
  normalize(path).split("/").at(-1)?.replace(/\.[^.]+$/, "") ?? "note";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const directoriesFor = (path: string) => {
  const parts = normalize(path).split("/");
  const languageIndex = parts.findIndex(
    (part) => part === "en" || part === "fi",
  );

  return parts.slice(languageIndex + 1, -1).map(slugify).filter(Boolean);
};

const slugFor = (path: string) => {
  const name = fileName(path);
  const directories = directoriesFor(path);

  if (name === "index") {
    return directories.join("-");
  }

  return [...directories, slugify(name)].join("-");
};

const collectNoteRoutes = (directory: string): string[] => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);

    if (statSync(path).isDirectory()) {
      return collectNoteRoutes(path);
    }

    if (!/\.(html|md)$/.test(entry)) {
      return [];
    }

    if (!/\/(en|fi)\//.test(normalize(path))) {
      return [];
    }

    return slugFor(path);
  });
};

const githubPagesStaticRoutes = (): Plugin => ({
  name: "github-pages-static-routes",
  closeBundle() {
    const indexPath = resolve("dist", "index.html");
    const fallbackPath = resolve("dist", "404.html");

    if (!existsSync(indexPath)) {
      return;
    }

    copyFileSync(indexPath, fallbackPath);

    const routes = new Set(collectNoteRoutes(resolve("notes")).filter(Boolean));

    for (const route of routes) {
      const routeDirectory = resolve("dist", route);
      mkdirSync(routeDirectory, { recursive: true });
      copyFileSync(indexPath, resolve(routeDirectory, "index.html"));
    }
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
    githubPagesStaticRoutes(),
  ],
});
