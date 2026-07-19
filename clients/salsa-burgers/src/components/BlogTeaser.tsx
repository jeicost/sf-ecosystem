import Link from "next/link";
import { getPosts } from "@/lib/cms-posts";

export async function BlogTeaser() {
  const posts = await getPosts();
  const featured = posts.slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-28 bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full inline-block mb-5">
              The Salsa Blog
            </span>
            <h2
              className="font-black text-white uppercase tracking-tighter leading-none"
              style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
            >
              BURGER{" "}
              <span style={{ color: "#ff0000" }}>KNOWLEDGE</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-2 text-white/50 hover:text-white font-black uppercase tracking-wider text-sm transition-colors duration-200"
          >
            View all →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0f0f0f] transition-all duration-300 hover:border-[#ff0000]/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,0,0,0.12)]"
            >
              <div className="p-6">
                {post.category && (
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff0000] border border-[#ff0000]/30 px-2.5 py-1 rounded-full bg-[#ff0000]/8 inline-block mb-4">
                    {post.category}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight mb-3 group-hover:text-[#ff0000] transition-colors duration-200 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-5">
                  {post.excerpt}
                </p>
                <span className="text-[#ff0000] text-xs font-black uppercase tracking-wider group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white font-black uppercase tracking-wider text-sm transition-colors"
          >
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  );
}
