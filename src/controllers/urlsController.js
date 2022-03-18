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
      await connection.query(
        `
      INSERT INTO 
        visits ("urlId", "visitCount")
      VALUES  ($1, 0)
      `,
        [urlId]
      );
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

    /*  const urlId = shortsUrls.fields;
    console.log(
      "🚀 ~ file: urlsController.js ~ line 89 ~ getShortUrl ~ urlId",
      urlId
    );

    const visitsResult = await connection.query(
      `
      SELECT 
      *
      FROM visits
      WHERE "urlId"=$1
      `,
      [urlId]
    );

    console.log(visitsResult.rows);
    let visits = visitsResult.rows[0].visitCount;
    visits++;

    await connection.query(
      `
        UPDATE visits 
        SET "visitCount"=$1
      `,
      [visits]
    );

    const response = shortsUrls.map(row=>{
      const []
    }) */

    res.status(200).send(shortsUrls.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
export async function deleteUrl(req, res) {
  const { user } = res.locals;
  const urlId = req.params.id;
  try {
    const urls = await connection.query(
      `
    SELECT *
    FROM urls
    JOIN "shortenedUrls" 
      ON "shortenedUrls"."urlId"=urls.id
    WHERE urls.id=$1
    `,
      [urlId]
    );
    if (urls.rowCount === 0) return res.sendStatus(404);
    if (urls.rows[0].userId !== user.id) return res.sendStatus(401);

    await connection.query(
      `
    DELETE  
    FROM "shortenedUrls"
    WHERE "urlId"=$1
    `,
      [urlId]
    );

    await connection.query(
      `
    DELETE  
    FROM visits
    WHERE "urlId"=$1
    `,
      [urlId]
    );

    await connection.query(
      `
    DELETE
    FROM urls
    WHERE id=$1
    `,
      [urlId]
    );

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
