import { ExtLink } from "@/components/outputs/ExtLink";
import { resume } from "@/content/resume";

type Props = {
  /** Heading level for the sections; 3 when the résumé sits under an h2. */
  headingLevel?: 2 | 3;
};

export function ResumeOutput({ headingLevel = 2 }: Props) {
  const Section = headingLevel === 3 ? "h3" : "h2";
  const Role = headingLevel === 3 ? "h4" : "h3";
  return (
    <div className="resume">
      <p className="resume-title">{resume.title}</p>
      <p>
        <ExtLink href={resume.pdf}>pdf version</ExtLink>
      </p>
      <p>{resume.summary}</p>

      <Section className="resume-heading">skills</Section>
      <dl className="resume-skills">
        {resume.skills.map((group) => (
          <div key={group.label}>
            <dt>{group.label}</dt>
            <dd>{group.items.join(", ")}</dd>
          </div>
        ))}
      </dl>

      <Section className="resume-heading">experience</Section>
      {resume.jobs.map((job) => (
        <section key={`${job.company} ${job.from}`} className="job">
          <div className="job-head">
            <Role className="job-title">{`${job.title} @ ${job.company}`}</Role>
            <span className="job-dates">{`${job.from} - ${job.to}`}</span>
          </div>
          <ul className="job-points">
            {job.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}

      <Section className="resume-heading">education</Section>
      <ul className="job-points">
        {resume.education.map((item) => (
          <li key={item.school}>{`${item.school}: ${item.credential}`}</li>
        ))}
      </ul>
    </div>
  );
}
