import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
}

const MarkdownRenderer = ({ content }: Props) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-p:text-secondary-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;
            return inline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs" {...props}>
                {children}
              </code>
            ) : (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  margin: "0.5rem 0",
                  background: "hsl(220 20% 6%)",
                  border: "1px solid hsl(220 20% 14%)",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto rounded-lg border border-border my-2">
                <table className="w-full text-xs">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="px-3 py-2 text-left bg-muted text-foreground font-mono text-xs uppercase">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 border-t border-border text-secondary-foreground">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
