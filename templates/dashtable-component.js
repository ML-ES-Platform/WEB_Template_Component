'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { GripVertical, RotateCcw, Save, Trash2 } from 'lucide-react'

export default function Dashtable({ children, onLayoutChange, initialLayout }) {
  const [columns, setColumns] = useState(1)
  const [items, setItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize items from children
  useEffect(() => {
    if (children) {
      const childrenArray = Array.isArray(children) ? children : [children]
      const newItems = childrenArray.map((child, index) => ({
        id: `item-${index}`,
        content: child,
        originalIndex: index
      }))
      
      // Apply initial layout if provided
      if (initialLayout && initialLayout.length === newItems.length) {
        const reorderedItems = initialLayout.map(layoutIndex => 
          newItems.find(item => item.originalIndex === layoutIndex)
        ).filter(Boolean)
        setItems(reorderedItems)
      } else {
        setItems(newItems)
      }
    }
  }, [children, initialLayout])

  // Update responsive columns
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1536) setColumns(4)
      else if (width >= 1280) setColumns(3)
      else if (width >= 1024) setColumns(2)
      else setColumns(1)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  const handleDragEnd = (result) => {
    setIsDragging(false)
    
    if (!result.destination) return

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    setItems(newItems)
    setHasUnsavedChanges(true)
    
    // Call the layout change callback if provided
    if (onLayoutChange) {
      const newLayout = newItems.map(item => item.originalIndex)
      onLayoutChange(newLayout)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const resetLayout = () => {
    const originalOrder = [...items].sort((a, b) => a.originalIndex - b.originalIndex)
    setItems(originalOrder)
    setHasUnsavedChanges(false)
    
    if (onLayoutChange) {
      const originalLayout = originalOrder.map(item => item.originalIndex)
      onLayoutChange(originalLayout)
    }
  }

  const saveLayout = () => {
    setHasUnsavedChanges(false)
    // In a real app, you might save to localStorage or send to an API
    console.log('Layout saved:', items.map(item => item.originalIndex))
  }

  const removeItem = (itemId) => {
    const newItems = items.filter(item => item.id !== itemId)
    setItems(newItems)
    setHasUnsavedChanges(true)
    
    if (onLayoutChange) {
      const newLayout = newItems.map(item => item.originalIndex)
      onLayoutChange(newLayout)
    }
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-[2000px] mx-auto">
        
        {/* Control Bar */}
        <div className="mb-6 flex items-center justify-between bg-zinc-950/60 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-4 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 font-medium">Dashboard Layout</span>
            </div>
            <div className="text-sm text-slate-400">
              {items.length} components • {columns} columns
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-amber-400 text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            
            <button
              onClick={resetLayout}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors duration-200"
              title="Reset to original layout"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            
            <button
              onClick={saveLayout}
              disabled={!hasUnsavedChanges}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                hasUnsavedChanges 
                  ? 'bg-emerald-600/50 hover:bg-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
              }`}
              title="Save current layout"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Draggable Grid */}
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <Droppable droppableId="dashboard">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid gap-4 md:gap-6 lg:gap-8 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-cyan-500/5 rounded-2xl p-4' : ''
                }`}
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                }}
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'scale-105 rotate-2 z-50 shadow-2xl' 
                            : isDragging 
                              ? 'scale-95 opacity-80' 
                              : 'hover:scale-[1.02]'
                        }`}
                        style={{
                          transform: snapshot.isDragging 
                            ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
                            : provided.draggableProps.style?.transform,
                          ...provided.draggableProps.style
                        }}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className={`absolute -top-2 -right-2 z-10 w-8 h-8 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 ${
                            snapshot.isDragging || isDragging
                              ? 'opacity-100 scale-110' 
                              : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                          }`}
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className={`absolute -top-2 -left-2 z-10 w-8 h-8 bg-red-600/90 backdrop-blur-sm border border-red-500/50 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-500/90 ${
                            snapshot.isDragging || isDragging
                              ? 'opacity-100 scale-110' 
                              : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                          }`}
                          title="Remove component"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>

                        {/* Dragging Overlay */}
                        {snapshot.isDragging && (
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl border-2 border-cyan-400/50 pointer-events-none animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-3xl blur-xl"></div>
                          </div>
                        )}

                        {/* Component Content */}
                        <div className={`transition-all duration-200 ${
                          snapshot.isDragging ? 'pointer-events-none' : ''
                        }`}>
                          {item.content}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 text-lg mb-2">No components to display</div>
            <div className="text-slate-600 text-sm">Add some dashboard components to get started</div>
          </div>
        )}
        
        {/* Drag Instructions */}
        {items.length > 1 && !isDragging && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/30 rounded-lg text-slate-400 text-sm">
              <GripVertical className="w-4 h-4" />
              <span>Hover over cards and drag the handles to reorder</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}