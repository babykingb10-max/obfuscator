import { SourceLanguage } from "./types";

export interface CodeExample {
  id: string;
  label: string;
  language: SourceLanguage;
  code: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: "js-basic",
    label: "JavaScript -- API call",
    language: "javascript",
    code: `function greet(name) {
  const apiKey = "sk_live_51NxSampleKeyDoNotUse";
  console.log("Hello, " + name);
  return apiKey;
}

greet("world");
`,
  },
  {
    id: "ts-basic",
    label: "TypeScript -- typed helper",
    language: "typescript",
    code: `interface User {
  id: number;
  name: string;
}

function formatUser(user: User): string {
  return \`#\${user.id} \${user.name}\`;
}

const admin: User = { id: 1, name: "Admin" };
console.log(formatUser(admin));
`,
  },
  {
    id: "jsx-basic",
    label: "JSX -- React component",
    language: "jsx",
    code: `function Greeting({ name }) {
  return (
    <div className="greeting">
      <h1>Hello, {name}!</h1>
    </div>
  );
}

export default Greeting;
`,
  },
  {
    id: "html-basic",
    label: "HTML -- page with inline script",
    language: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Demo Page</title>
</head>
<body>
  <h1 id="title">Hello!</h1>
  <script>
    const secretToken = "123456789:ABCDEFghijklmnopqrstuvwxyz012345678";
    document.getElementById("title").textContent = "Loaded";
  </script>
</body>
</html>
`,
  },
  {
    id: "css-basic",
    label: "CSS -- component styles",
    language: "css",
    code: `.card {
  background: #111318;
  border-radius: 12px;
  padding: 16px;
}

.card__title {
  color: #39ff88;
  font-size: 1.25rem;
}
`,
  },
  {
    id: "json-basic",
    label: "JSON -- config file",
    language: "json",
    code: `{
  "name": "adevos-x-demo",
  "version": "1.0.0",
  "apiKey": "sk_live_51NxSampleKeyDoNotUse"
}
`,
  },
];
