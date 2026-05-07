import { getCollection } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import { createElement } from "react";
import satori from "satori";

const STATIC_PAGES = [
  {
    slug: "home",
    title: "Praxor Kit",
    description: "Ship paid SaaS faster, without lock-in.",
  },
  {
    slug: "pricing",
    title: "Pricing — Praxor Kit",
    description: "Simple, transparent pricing for every stage.",
  },
  {
    slug: "blog",
    title: "Blog — Praxor Kit",
    description: "Insights and updates from the Praxor Kit team.",
  },
  {
    slug: "terms",
    title: "Terms of Service — Praxor Kit",
    description: "",
  },
  {
    slug: "privacy",
    title: "Privacy Policy — Praxor Kit",
    description: "",
  },
];

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog");
  const blogPaths = posts
    .filter((p) => !p.data.draft)
    .map((post) => ({
      params: { slug: `blog-${post.id}` },
      props: { title: post.data.title, description: post.data.description },
    }));
  const staticPaths = STATIC_PAGES.map((page) => ({
    params: { slug: page.slug },
    props: { title: page.title, description: page.description },
  }));
  return [...staticPaths, ...blogPaths];
};

// Swap to fs.readFileSync('./public/fonts/Inter-Regular.woff') for offline builds
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function getFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (fontRegular && fontBold) return [fontRegular, fontBold];
  const base = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest";
  [fontRegular, fontBold] = await Promise.all([
    fetch(`${base}/latin-400-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${base}/latin-700-normal.woff`).then((r) => r.arrayBuffer()),
  ]);
  return [fontRegular, fontBold];
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as { title: string; description: string };
  const [regular, bold] = await getFonts();

  const svg = await satori(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          backgroundColor: "#0a0a0a",
          fontFamily: "Inter",
        },
      },
      createElement(
        "p",
        { style: { fontSize: "20px", color: "#6b7280", margin: "0 0 16px 0", fontWeight: 400 } },
        "Praxor Kit",
      ),
      createElement(
        "h1",
        {
          style: {
            fontSize: title.length > 40 ? "44px" : "56px",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0",
            lineHeight: 1.1,
          },
        },
        title,
      ),
      description
        ? createElement(
            "p",
            {
              style: { fontSize: "22px", color: "#9ca3af", margin: "20px 0 0 0", fontWeight: 400 },
            },
            description,
          )
        : null,
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
