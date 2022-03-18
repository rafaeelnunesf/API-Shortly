import { connection } from "../database.js";
import { nanoid } from "nanoid";

export async function postUrl(req, res) {
  const { user } = res.locals;
  const { url } = req.body;
  try {
    const existingUrls = await connection.query(
      "SELECT * FROM urls WHERE url=$1",
      [url]
    );
    let urlId;
    if (existingUrls.rowCount === 0) {
      await connection.query(
        `
      INSERT INTO 
        urls (url,"userId")
      VALUES  ($1, $2)
      `,
        [url, user.id]
      );
      urlId = existingUrls.rows[0].id;
    } else {
      const urlResult = await connection.query(
        `
      SELECT 
        urls.id
      FROM urls
      WHERE urls.url=$1
      `,
        [url]
      );
      urlId = urlResult.rows[0].id;
    }

    const shortUrl = nanoid();

    await connection.query(
      `
    INSERT INTO 
    "shortenedUrls" ("shortUrl","urlId")
    VALUES  ($1, $2)
    `,
      [shortUrl, urlId]
    );

    res.status(201).send({ shortUrl });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
export async function getShortUrl(req, res) {
  const { shortUrl } = req.params;
  try {
    const shortsUrls = await connection.query(
      `
      SELECT 
      "shortenedUrls".id,
      "shortenedUrls"."shortUrl",
      urls.url
      FROM "shortenedUrls"
      JOIN urls
        ON urls.id="shortenedUrls"."urlId"
      WHERE "shortenedUrls".id=$1
      `,
      [shortUrl]
    );
    if (shortsUrls.rowCount === 0) return res.sendStatus(404);

    res.status(200).send(shortsUrls.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
