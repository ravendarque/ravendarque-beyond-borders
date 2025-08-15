
# 📄 PRD: Dataset of Oppressed Nations, Peoples, and Marginalised Groups

## 1. Objective
Produce a **structured YAML dataset** of flags representing countries, peoples, and marginalised groups under oppression. This will be used by another prompt to create the coloured flag borders in the app

The dataset should include:  
- Authoritarian states  
- Occupied / disputed territories  
- Stateless or oppressed peoples  
- LGBTQIA+ communities

This file will serve as a reusable knowledge base for further applications (visualizations, websites, educational resources).  

---

## 2. Data Format

- **File format**: `YAML`  
- **Root key**: `flags`  
- **Each entry** must contain the following fields:

| Field       | Type   | Description |
|-------------|--------|-------------|
| `name`      | String | The official or widely recognized name of the flag, including entity name. |
| `svg_url`   | URL    | Direct link to the SVG version of the flag (preferably Wikimedia Commons). |
| `description` | String | Description of the flag’s design and symbols. |
| `type`      | Enum (Human-readable) | Category of cause: `"Authoritarian State"`, `"Occupied / Disputed Territory"`, or `"Stateless People"`. |
| `reason`    | String | A concise explanation of why the entity is under oppression. |
| `link`      | URL    | A link to more information about the cause. |

---

## 3. Data Sources

- **Primary source**: [Wikimedia Commons](https://commons.wikimedia.org) (for SVG URLs)  
- **Secondary sources**:  
  - Wikipedia articles on each flag/entity  
  - Reports from NGOs (Amnesty, Human Rights Watch, Freedom House) for reasons  

---

## 4. Categorization Rules

1. **Authoritarian State**  
   - UN-recognized sovereign states with limited/no political freedoms, dictatorship, or monarchy with repression.  
   - Examples: North Korea, Eritrea, China, Iran.  

2. **Occupied / Disputed Territory**  
   - Regions with partial or no international recognition, under foreign occupation, or secessionist entities.  
   - Examples: Palestine, Tibet, Western Sahara, Chechnya, Kosovo.  

3. **Stateless People**  
   - Nations or ethnic groups without recognized statehood, often facing persecution.  
   - Examples: Kurds, Uyghurs, Rohingya, Tamils, Ogaden Somalis, Baloch.  

4. **Marginalised Groups**
   - Groups facing systemic discrimination or social exclusion within a state.
   - Examples: LGBTQIA+ communities, Indigenous peoples

---

## 5. YAML File Structure (Example)

```yaml
flags:
  - name: "North Korea – Ramhongsaek Konghwagukgi"
    svg_url: "https://commons.wikimedia.org/wiki/File:Flag_of_North_Korea.svg"
    description: "Red central band with blue edges and a red star in a white circle."
    type: "Authoritarian State"
    reason: "Totalitarian dictatorship under the Kim regime with severe human rights abuses."

  - name: "Tibet – Snow Lion Flag"
    svg_url: "https://en.wikipedia.org/wiki/File:Flag_of_Tibet.svg"
    description: "White mountain with snow lions, rising sun, and Buddhist symbols."
    type: "Occupied / Disputed Territory"
    reason: "Banned in Tibet since Chinese annexation in 1951, symbol of resistance."

  - name: "Kurdistan – Kurdish Flag"
    svg_url: "https://commons.wikimedia.org/wiki/File:Flag_of_Kurdistan.svg"
    description: "Red, white, and green tricolor with golden sun emblem (Roj)."
    type: "Stateless People"
    reason: "Represents Kurdish independence aspirations, suppressed in Turkey, Iran, Syria."
```

---

## 6. Steps to Produce the File

1. **Define Scope**  
   - List all entities to be included (authoritarian states, occupied territories, stateless peoples).  

2. **Collect Flag Assets**  
   - Locate official or widely recognized flag SVGs on Wikimedia Commons.  

3. **Draft Entries**  
   - Write `name`, `svg_url`, and `description` for each entity.  

4. **Categorize**  
   - Assign `type` according to rules in Section 4.  

5. **Write Reasons**  
   - Summarize why each entity is considered under oppression (max 1–2 sentences).  

6. **Compile YAML**  
   - Follow the exact format in Section 2 and Section 5.  
   - Validate with a YAML linter to ensure no syntax errors.  

7. **Save File**  
   - Path: `/agentic-flow/outputs/flag-data.yaml`

---