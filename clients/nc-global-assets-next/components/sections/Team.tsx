'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eyebrow, Arrow, LinkedInIcon } from '@/lib/constants'

export const TEAM_DEFAULTS = {
  eyebrow: 'The Team',
  headline_top: 'Led by operators entrepreneurs and ',
  headline_gold: 'market builders',
  team: [
    {
      name: "Carlos Jacoste",
      role: "Founder & Operating Partner",
      bio: "Entrepreneur and founder of Startups Factory — 15+ years in startups, open innovation, digital growth and international expansion. Worked with ICEX, Playtomic and other innovation-driven ventures.",
      img: "/assets/carlos-dark.jpg",
      linkedin: "https://th.linkedin.com/in/carlosjacoste",
    },
    {
      name: "Nirada Kritsanaseranee",
      role: "Director of Marketing",
      bio: "Digital marketing director with 6+ years of experience leading paid media, brand activation and go-to-market strategies for companies entering new markets. Deep understanding of the Thai consumer — connecting strategy, content and local execution.",
      img: "/assets/nirada-dark.jpg",
      linkedin: "https://th.linkedin.com/in/nirada-k",
    },
  ],
  closing_pre: 'Together, the team combines international business vision with ',
  closing_gold: 'local execution capacity',
  closing_suffix: ' in Thailand.',
}

export function Team({ data = TEAM_DEFAULTS }: { data?: typeof TEAM_DEFAULTS }) {
  const team = data.team

  return (
    <section className="section" id="team">
      <div className="container">
        <div className="sec-header">
          <div className="lhs">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="display-lg">{data.headline_top}<span className="italic gold">{data.headline_gold}</span></h2>
          </div>
          <div />
        </div>
        <div className="team-grid">
          {team.map((member, i) => (
            <div className="team-card" key={i}>
              <div className="portrait">
                <Image src={member.img} alt={member.name} width={280} height={320} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="portrait__tint" />
              </div>
              <div className="role">{member.role}</div>
              <div className="name">{member.name}</div>
              <p className="bio">{member.bio}</p>
              <Link href={member.linkedin} target="_blank" rel="noopener" className="team-link">
                <LinkedInIcon /> Connect on LinkedIn <Arrow />
              </Link>
            </div>
          ))}
        </div>
        <p className="display-md" style={{ marginTop: 80, maxWidth: 860, color: "var(--ink)" }}>
          {data.closing_pre}<span className="italic gold">{data.closing_gold}</span>{data.closing_suffix}
        </p>
      </div>
    </section>
  )
}
