import { ExtLink } from "@/components/outputs/ExtLink";
import { contact, email } from "@/content/links";

/** The always-visible ways to reach Parker, under the name banner. */
export function ContactLine() {
  return (
    <p className="contact-line">
      {contact.map((link, index) => (
        <span key={link.href}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          {link.href.startsWith("mailto:") ? (
            // The address itself, so it can be read and copied without a mail app.
            <a className="ext" href={link.href}>
              {email}
            </a>
          ) : (
            <ExtLink href={link.href}>{link.label}</ExtLink>
          )}
        </span>
      ))}
    </p>
  );
}
