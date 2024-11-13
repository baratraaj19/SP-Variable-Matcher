import React, { useState } from "react"
import objidData from "./objid.json" // Import the JSON file
import CopyField from "./components/CopyField"

function App() {
  const [templateId, setTemplateId] = useState("") // State for Template ID
  const [spInput, setSpInput] = useState("")
  const [variablesInput, setVariablesInput] = useState("")
  const [result, setResult] = useState([])
  const [ignoredVariablesInput, setIgnoredVariablesInput] = useState("")
  const [uniqueObjNames, setUniqueObjNames] = useState([])
  const [variablesNotFound, setVariablesNotFound] = useState([])

  // Initialize ignoredVariables as an empty array, it will be updated by the user's input
  const ignoredVariables = ignoredVariablesInput
    .split("\n")
    .map((v) => v.trim())
    .filter((v) => v) // Remove empty values

  const handleFindObjNames = () => {
    // Filter out variables to ignore
    const variables = variablesInput
      .split("\n")
      .map((v) => v.trim()) // Trim any extra spaces
      .filter(
        (v) => v && !ignoredVariables.includes(v) // Exclude variables in the ignored list and empty values
      )

    const spLines = spInput.split("\n")
    const objNames = []
    const uniqueNamesSet = new Set()
    const notFoundVariables = []

    variables.forEach((variable) => {
      const [variableName, type] = variable.split(" ")

      // Check if each variable exists in the SP
      let found = false
      for (let i = 0; i < spLines.length; i++) {
        const line = spLines[i].trim()

        // First, check if the variable exists in this line
        const variablePattern = new RegExp(
          `\\[(?:CaseInfo/)?(?:_x090_)?${variableName}_x0020_${type}_x007C_HD_[A-Z]+\\]`
        )

        if (variablePattern.test(line)) {
          // If variable found, look for ObjName in the same line first
          const objNameInLineMatch = line.match(/ObjName='([^']+)'/)
          if (objNameInLineMatch) {
            const objName = objNameInLineMatch[1]
            objNames.push(`${objidData[objName]}: '${objName}'`) // Get ID from objidData
            uniqueNamesSet.add(objName)
            found = true
            break
          }

          // If not found in the same line, backtrack to find the nearest CASE statement
          for (let j = i; j >= 0; j--) {
            const caseLine = spLines[j].trim()
            if (
              caseLine.startsWith("CASE WHEN EXISTS") ||
              caseLine.startsWith("WHEN EXISTS")
            ) {
              const objNameMatch = caseLine.match(/ObjName='(\w+)'/)
              if (objNameMatch) {
                const objName = objNameMatch[1]
                objNames.push(`${variableName}: ${objName}`) // Get ID from objidData
                uniqueNamesSet.add(objName)
                found = true
              }
              break
            }
          }
        }

        if (found) break
      }

      if (!found) {
        notFoundVariables.push(variable) // Track variables not found in SP
      }
    })

    setResult(objNames)
    setUniqueObjNames(Array.from(uniqueNamesSet))
    setVariablesNotFound(notFoundVariables) // Set variables not found
  }

  const contentToCopy = `${[...uniqueObjNames]
    .sort((a, b) => (objidData[a] > objidData[b] ? 1 : -1)) // Sort based on objidData values
    .map(
      (objName) =>
        `EXEC [dbo].[HotDocs_TemplateDataObjectInsert] 'skarthik', ${templateId}, ${objidData[objName]}, '${objName}'`
    )
    .join("\n")}`

  // Function to download the results as a text file
  const downloadResults = () => {
    const content = `
Template ID: ${templateId}


Script:

${[...uniqueObjNames]
  .sort((a, b) => (objidData[a] > objidData[b] ? 1 : -1)) // Sort based on objidData values
  .map(
    (objName) =>
      `EXEC [dbo].[HotDocs_TemplateDataObjectInsert] 'skarthik', ${templateId}, ${objidData[objName]}, '${objName}'`
  )
  .join("\n")}


ObjNames:

${uniqueObjNames
  .map((objName) => `${objidData[objName]}: '${objName}'`)
  .join("\n")}

Variables Not Found:

${variablesNotFound.join("\n")}

Results:

${result.join("\n")}
    `

    const blob = new Blob([content], { type: "text/plain" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "results.txt"
    link.click()
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6'>
      v1.1.0
      <h1 className='text-2xl font-bold mb-4'>SP Variable Matcher</h1>
      <div className='w-full max-w-8xl flex space-x-8 bg-white p-6 rounded-lg shadow-md'>
        {/* Left side: Inputs */}
        <div className='w-1/2 space-y-4'>
          {/* Template ID Input */}
          <div className='mb-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Template ID
            </label>
            <input
              type='text'
              placeholder='Enter Template ID'
              className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </div>

          {/* Stored Procedure Input */}
          <div className='mb-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Stored Procedure
            </label>
            <textarea
              placeholder='Paste Stored Procedure here...'
              className='w-full h-40 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              value={spInput}
              onChange={(e) => setSpInput(e.target.value)}
            />
          </div>

          {/* Variables Input */}
          <div className='mb-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Variables (CaseNumber TE will be ignored)
            </label>
            <textarea
              placeholder='Enter Variables here...'
              className='w-full h-40 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
            />
          </div>

          {/* Input field for ignored variables */}
          <div className='mb-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Ignored Variables (one per line)
            </label>
            <textarea
              placeholder='Enter ignored variables here...'
              className='w-full h-40 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              value={ignoredVariablesInput}
              onChange={(e) => setIgnoredVariablesInput(e.target.value)}
            />
          </div>

          {/* Find ObjNames Button */}
          <button
            onClick={handleFindObjNames}
            className='w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
            Find ObjNames
          </button>

          {/* Download Results Button */}
          <button
            onClick={downloadResults}
            className='w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mt-4'>
            Download Results
          </button>
        </div>
        {/* Right side: Outputs */}
        <div className='w-full max-w-6xl   bg-slate-100 rounded-lg shadow-md '>
          {/* ObjNames Section */}
          <div className=' pt-6 px-6'>
            <CopyField contentToCopy={contentToCopy} />
          </div>
          <div className='flex space-x-8 p-6 '>
            <div className='space-y-4 '>
              <div>
                <h2 className='text-lg font-semibold mb-2'>Unique ObjNames:</h2>
                <ul className='list-disc pl-5 space-y-1'>
                  {[...uniqueObjNames]
                    .sort((a, b) => (objidData[a] > objidData[b] ? 1 : -1)) // Sort based on objidData values
                    .map((objName, idx) => (
                      <li key={idx} className='text-gray-700'>
                        {objidData[objName]}, '{objName}'
                        {/* Display ID and name */}
                      </li>
                    ))}
                </ul>
              </div>

              {/* Variables Not Found Section */}
              <div>
                <h2 className='text-lg font-semibold mb-2 text-red-600'>
                  {variablesNotFound.length > 0 ? "Variables Not Found:" : ""}
                </h2>
                <ul className='list-disc pl-5 space-y-1'>
                  {variablesNotFound.map((variable, idx) => (
                    <li key={idx} className='text-gray-700'>
                      {variable}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Results Section */}
            <div>
              <h2 className='text-lg font-semibold mb-2'>Results:</h2>
              <ul className='list-disc pl-5 space-y-1'>
                {result.map((line, idx) => (
                  <li key={idx} className='text-gray-700'>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className='pt-4 text-center text-gray-500'>@copyright 2024</div>
    </div>
  )
}

export default App
