const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const intilizationOfDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("The server is running at http://localhost:3002/");
    });
  } catch (error) {
    console.log(`The error is ${error.message}`);
    process.exit(1);
  }
};

intilizationOfDb();

const convertStateObjToResponseObj = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const convertDistrictObjToResObj = (distObj) => {
  return {
    districtId: distObj.district_id,
    districtName: distObj.district_name,
    stateId: distObj.state_id,
    cases: distObj.cases,
    cured: distObj.cured,
    active: distObj.active,
    deaths: distObj.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT *
    FROM 
       state
    ORDER BY state_id;`;
  let result = await db.all(statesQuery);
  response.send(
    result.map((eachItem) => convertStateObjToResponseObj(eachItem))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
        *
    FROM 
    state
    WHERE state_id = ${stateId};`;
  let getResult = await db.get(stateQuery);
  response.send(convertStateObjToResponseObj(getResult));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
    INSERT INTO 
      district(district_name,state_id,cases,cured,active,deaths)
    VALUES 
       (
           '${districtName}',
           ${stateId},
           ${cases},
           ${cured},
           ${active},
           ${deaths}
       );`;
  const districtQueryResult = await db.run(districtQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT 
        *
    FROM 
    district
    WHERE district_id = ${districtId};`;
  let districtResult = await db.get(districtQuery);

  response.send(convertDistrictObjToResObj(districtResult));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
  DELETE FROM  district 
WHERE district_id = ${districtId};`;
  const districtResult = await db.run(districtQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `
  UPDATE district
  SET 
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  const districtResult = await db.run(districtQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM 
    district
    WHERE state_id = ${stateId};`;

  const result = await db.get(stateQuery);
  response.send(result);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT 
        state_name AS stateName
    FROM 
    district JOIN state
    ON district.state_id = state.state_id
    WHERE district_id = ${districtId};`;
  const districtResult = await db.get(districtQuery);
  response.send(districtResult);
});

module.exports = app;
