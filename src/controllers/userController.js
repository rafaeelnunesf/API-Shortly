import bcrypt from "bcrypt";
import { connection } from "../database.js";

export async function createUser(req, res) {
  const user = req.body;

  try {
    const existingUsers = await connection.query(
      "SELECT * FROM users WHERE email=$1",
      [user.email]
    );
    if (existingUsers.rowCount > 0) {
      return res.sendStatus(409);
    }

    const passwordHash = bcrypt.hashSync(user.password, 10);

    await connection.query(
      `
      INSERT INTO 
        users(name, email, password) 
      VALUES ($1, $2, $3)
    `,
      [user.name, user.email, passwordHash]
    );

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getUser(req, res) {
  const { user } = res.locals;

  try {
    res.send(user);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const user = await connection.query({
      text: `
      SELECT 
        *
      FROM users
      
      JOIN urls 
        ON users.id=urls."userId"
      
      JOIN "shortenedUrls"
        ON urls.id="shortenedUrls"."urlId"
      
      JOIN visits
        ON urls.id=visits."urlId"
    `,
      rowMode: "array",
    });
    res.send(user);
    /* res.send(
      user.rows.map((row) => {
        let [id, name, visiCount] = row;
        return { id, name, visiCount };
      })
    ); */
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
