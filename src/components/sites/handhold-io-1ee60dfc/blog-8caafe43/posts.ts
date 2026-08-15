export type BlogSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "qa"; items: { q: string; a: string }[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Customer Stories" | "Growth";
  date: string;
  author?: string;
  body?: BlogSection[];
}

export const posts: BlogPost[] = [
  {
    slug: "parim-case-study",
    title: "How Parim cut bad-fit demos by 60% with an AI demo agent",
    excerpt:
      "Parim's sales reps were spending hours on demos with prospects who were never a fit, and inbound arriving after hours never reached them. Here's how an AI demo agent changed that.",
    category: "Customer Stories",
    date: "July 1, 2026",
    author: "Georg Vooglaid",
    body: [
      {
        type: "paragraph",
        text: "Parim's sales reps were spending hours on demos with prospects who were never a fit, and inbound arriving after hours never reached them. Here's how an AI demo agent changed that.",
      },
      {
        type: "paragraph",
        text: "For most B2B software teams, the demo is where sales time quietly leaks away. Parim, a workforce-management platform, found that a large share of its reps' demo hours were going to prospects who were never a real fit, while genuinely interested buyers who arrived outside business hours couldn't reach anyone at all. After deploying Handhold's AI demo agent, Parim cut bad-fit demos reaching its reps by 60%, freeing that time for the leads that actually convert.",
      },
      { type: "heading", text: "TL;DR" },
      {
        type: "list",
        items: [
          "Parim's reps spent meaningful time on demos with prospects who were never going to buy, and inbound arriving outside business hours went unanswered.",
          "Handhold's AI demo agent now qualifies inbound and runs a personalised demo for every visitor, 24/7.",
          "The result: a 60% reduction in bad-fit leads reaching human-led demo calls, and coverage for buyers who arrive outside working hours.",
        ],
      },
      {
        type: "quote",
        text: "Our sales reps are less occupied with bad fit leads, creating extra capacity for outbound.",
        attribution: "Alasdair Reynolds, Head of Growth, Parim",
      },
      { type: "heading", text: "Who is Parim?" },
      {
        type: "paragraph",
        text: 'Parim is a B2B SaaS workforace-management platform serving a largely non-technical buyer in a traditional industry. Like many products in its category, it relies on a "book a demo" motion as the main way prospects evaluate the product, rather than a self-serve free trial. That makes the demo the single most important, and most time-expensive, step in its sales process.',
      },
      { type: "heading", text: "What problem was Parim trying to solve?" },
      {
        type: "paragraph",
        text: "Two problems, both rooted in the same constraint: human demos don't scale.",
      },
      {
        type: "paragraph",
        text: "First, qualification was happening too late. A meaningful chunk of rep time went to demos with prospects who turned out not to be a fit, time that could have gone to genuine opportunities or to outbound. Every bad-fit demo on the calendar is an hour a rep doesn't spend on a deal that could close.",
      },
      {
        type: "paragraph",
        text: "Second, coverage was capped by working hours. Parim's demo availability ran roughly nine-to-six, tied to the team's own schedule. Inbound interest that arrived in the evening, over a weekend, or from a different time zone simply couldn't reach anyone, and a prospect who can't get a demo when their interest is highest often never comes back.",
      },
      { type: "heading", text: "How does an AI demo agent fix this?" },
      {
        type: "paragraph",
        text: "Handhold deploys an AI agent that meets every inbound visitor, runs a short discovery conversation to understand who they are and what they need, and then delivers a personalised demo tailored to that, around the clock. It is not a chatbot or a fixed product tour: the agent runs real discovery and adapts the demo to each prospect.",
      },
      {
        type: "paragraph",
        text: "For Parim, that changed the economics of the demo in two ways. The agent handles the first-touch qualification, so prospects who clearly aren't a fit are filtered before they ever land on a rep's calendar. And because the agent never clocks off, the demo is available the moment a buyer's interest peaks, not just during office hours.",
      },
      { type: "heading", text: "What results did Parim see?" },
      {
        type: "paragraph",
        text: "The headline result: a 60% reduction in bad-fit leads reaching human-led demo calls. Parim's reps now spend far less of their week on demos that were never going to convert, and that recovered capacity has gone back into higher-value work, including outbound.",
      },
      {
        type: "paragraph",
        text: "Just as importantly, Parim now has demo coverage outside regular business hours, so inbound that used to go unanswered now gets a real, personalised demo experience.",
      },
      {
        type: "quote",
        text: "Our sales reps are less occupied with bad fit leads, creating extra capacity for outbound, and Handhold's agent has been super useful for coverage outside of regular business hours.",
        attribution: "Alasdair Reynolds, Head of Growth, Parim",
      },
      { type: "heading", text: "Why this matters for other B2B teams" },
      {
        type: "paragraph",
        text: "Parim is a clear example of a pattern common to a lot of B2B software: high inbound interest, a non-technical buyer who needs to see the product before committing, and a sales team whose time is the bottleneck. When demos are the primary path to purchase and humans are the only ones who can run them, two things always break: qualification happens too late and coverage is capped by the clock. An AI demo agent addresses both at once, which is why the bad-fit reduction Parim saw tends to show up wherever this pattern exists.",
      },
      { type: "heading", text: "Frequently asked questions" },
      {
        type: "qa",
        items: [
          {
            q: "What is an AI demo agent?",
            a: "An AI demo agent is software that greets inbound prospects, runs a short discovery conversation to understand their needs, and delivers a personalised product demo in real time, 24/7. Unlike a chatbot or a pre-recorded product tour, it adapts the demo to each prospect based on what they tell it.",
          },
          {
            q: "How did Parim reduce bad-fit demos by 60%?",
            a: "Handhold's agent qualifies every inbound visitor through a discovery conversation before a human is involved. Prospects who aren't a fit are filtered at that stage, so they don't reach a rep's calendar, which cut bad-fit demos reaching Parim's team by 60%.",
          },
          {
            q: "Does the agent replace Parim's sales reps?",
            a: "No. It handles first-touch qualification and after-hours coverage, which frees reps to spend their time on qualified, higher-value opportunities and outbound, rather than on demos that were never going to convert.",
          },
          {
            q: "What kind of company is a good fit for this?",
            a: 'B2B software companies with high inbound interest, a buyer who wants to see the product before purchasing, and a sales team whose time is the constraint, especially where "book a demo" is the primary path to purchase rather than a self-serve trial.',
          },
        ],
      },
    ],
  },
  {
    slug: "buyers-qualify-you-in-chatgpt",
    title:
      "Your buyers are qualifying you inside ChatGPT before they ever book a demo",
    excerpt:
      "In 2026, B2B buyers shortlist software inside ChatGPT, Claude, and Perplexity before visiting a single website. Here's what that means for your inbound funnel, and how to stay visible at the exact moment buyers decide who to consider.",
    category: "Growth",
    date: "June 5, 2026",
  },
  {
    slug: "why-use-ai-demo-agents",
    title: "Why Use AI Demo Agents for Your Inbound (2026 Guide)",
    excerpt:
      "AI demo agents run discovery and deliver personalised demos 24/7, so prospects get answers instantly and sales teams focus on closing. Here is what they actually do, what problems they solve, and when to use one.",
    category: "Growth",
    date: "May 19, 2026",
  },
  {
    slug: "sdr-vs-ai-demo-agent",
    title:
      "Hiring an SDR vs deploying an AI demo agent - the honest comparison",
    excerpt:
      "Hiring an SDR to handle inbound demos is one of the most expensive decisions B2B SaaS companies make. Here's the math, and what most teams are choosing instead.",
    category: "Growth",
    date: "May 12, 2026",
  },
];
