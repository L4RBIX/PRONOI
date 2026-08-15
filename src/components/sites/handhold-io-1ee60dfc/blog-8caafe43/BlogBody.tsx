import type { BlogSection } from "./posts";

export function BlogBody({ sections }: { sections: BlogSection[] }) {
  return (
    <div>
      {sections.map((section, index) => {
        switch (section.type) {
          case "paragraph":
            return (
              <p key={index} className="text-gray-700 leading-relaxed mb-5">
                {section.text}
              </p>
            );
          case "heading":
            return (
              <h2 key={index} className="font-heading text-2xl mt-10 mb-4">
                {section.text}
              </h2>
            );
          case "list":
            return (
              <ul
                key={index}
                className="list-disc pl-5 space-y-2 text-gray-700 mb-5"
              >
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-2 border-gray-300 pl-4 italic text-gray-600 my-6"
              >
                <p>&ldquo;{section.text}&rdquo;</p>
                {section.attribution ? (
                  <footer className="not-italic text-sm text-gray-500 mt-2">
                    — {section.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );
          case "qa":
            return (
              <dl key={index} className="mb-5 space-y-5">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <dt className="font-heading text-lg mb-1">{item.q}</dt>
                    <dd className="text-gray-700 leading-relaxed">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
