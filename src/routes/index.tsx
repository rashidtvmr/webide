import { createFileRoute } from '@tanstack/react-router'
import { Sandpack } from "@codesandbox/sandpack-react";

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
     <Sandpack 
     template="react"
     theme={'dark'}
     />
    </div>
  )
}
