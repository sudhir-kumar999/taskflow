import sgMail from "@sendgrid/mail";

const key = process.env.SENDGRID_API_KEY;
export const sendGrid = (to: string, template: string) => {
  sgMail.setApiKey(key as string);
  const msg = {
    to: to,
    from: "akumar07067@gmail.com", // Use the email address or domain you verified above
    subject: "Sending mail to verify your email",
    html: template,
  };

  sgMail.send(msg).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    },
  );
  //ES8
  (async () => {
    try {
      await sgMail.send(msg);
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof Error) {
        console.error(error);
      }
    }
  })();
};
