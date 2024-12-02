import sgMail from "@sendgrid/mail";
import { Sequelize, DataTypes } from "sequelize";
import crypto from "crypto";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });

async function getSecretValue(secretName) {
  try {
    const response = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

export const handler = async (event) => {
  try {
    const secrets = await getSecretValue("sendgrid-api-key");
    const message = JSON.parse(event.Records[0].Sns.Message);
    const { email, userId } = message;

    const verificationToken = userId;
    const expirationTime = Date.now() + 2 * 60 * 1000; // 2 minutes

    // await storeVerificationDetails(userId, verificationToken, expirationTime);
    await sendVerificationEmail(
      email,
      verificationToken,
      secrets.SENDGRID_API_KEY
    );

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

async function sendVerificationEmail(email, token, apiKey) {
  //sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(apiKey);
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
