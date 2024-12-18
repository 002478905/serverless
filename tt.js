import sgMail from "@sendgrid/mail";
import { Sequelize, DataTypes } from "sequelize";
import crypto from "crypto";

export const handler = async (event) => {
  try {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const { email, userId } = message;

    const verificationToken = userId;
    const expirationTime = Date.now() + 2 * 60 * 1000; // 2 minutes

    // await storeVerificationDetails(userId, verificationToken, expirationTime);
    await sendVerificationEmail(email, verificationToken);

    return { statusCode: 200, body: "Verification email sent" };
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 500, body: "Error processing request" };
  }
};

function generateToken() {
  return crypto.randomBytes(20).toString("hex");
}

async function storeVerificationDetails(userId, token, expiration) {
  try {
    await sequelize.sync();
    await VerificationToken.create({
      userId: userId,
      token: token,
      expiresAt: new Date(expiration),
    });
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Failed to store verification details");
  }
}

async function sendVerificationEmail(email, token) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const verificationLink = `http://${process.env.VERIFICATION_BASE_URL}/v1/user/verify?token=${token}`;

  const msg = {
    to: email,
    from: "ro-reply@pankhurigupta.me",
    subject: "Verify Your Email",
    text: `Please verify your email by clicking on this link: ${verificationLink}`,
    html: `<p>Please verify your email by clicking on this link: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send verification email");
  }
}
