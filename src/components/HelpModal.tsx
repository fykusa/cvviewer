import { X, Search, RefreshCw, BoxSelect, LayoutGrid, Download, Database, Layers, ArrowRightCircle, Copy } from 'lucide-react';
import { VennIcon } from './VennIcon';
interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Help & Documentation</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-gray-700">

                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">About the Application</h3>
                        <p className="text-sm leading-relaxed">
                            This application is an interactive Viewer and Layout Editor for SAP HANA Calculation View XML files.
                            It allows you to visualize, explore, group, and rearrange nodes in complex SAP HANA models while maintaining structural integrity.
                            You can explore attribute mappings interactively and safely export the updated visual layout.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Toolbar Actions</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-gray-100 rounded text-gray-400 shrink-0"><Search className="w-4 h-4" /></div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Search</h4>
                                    <p className="text-xs text-gray-600">Finds nodes and columns by name or ID. Red borders indicate a node name match; cyan borders indicate an attribute or formula match.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-emerald-100 rounded text-emerald-600 shrink-0"><RefreshCw className="w-4 h-4" /></div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Update from file</h4>
                                    <p className="text-xs text-gray-600">Loads a new XML definition but retains all current node positions (ideal for updating a model that changed in HANA but keeping your manual layout).</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-amber-100 rounded text-amber-600 shrink-0"><BoxSelect className="w-4 h-4" /></div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Group Nodes</h4>
                                    <p className="text-xs text-gray-600">Select multiple nodes (using Shift+click or drag selection) and click here to combine them into a visual group for better organization.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-indigo-100 rounded text-indigo-600 shrink-0"><LayoutGrid className="w-4 h-4" /></div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Auto-Layout</h4>
                                    <p className="text-xs text-gray-600">Automatically aligns nodes hierarchically (bottom-to-top data flow).</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-slate-800 rounded text-white shrink-0"><Download className="w-4 h-4" /></div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Save Layout</h4>
                                    <p className="text-xs text-gray-600">Exports your updated graph layout into the original XML file format seamlessly.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Interactive Detail Views</h3>
                        <p className="text-sm leading-relaxed mb-4">
                            Clicking any node reveals its <strong>Sidebar</strong> context, detailing mapping flows and calculated columns. For specific data operations (like Joins, Unions, Projections), clicking the colorful diagram icon inside the node on the canvas (or in the top right of the sidebar) opens an <strong>Advanced Interactive Modal</strong> displaying visual data routing and mapping paths:
                        </p>
                        <div className="flex items-center gap-3 mb-8 text-sm text-gray-700">
                            <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-2 shadow-sm">
                                <VennIcon vennType="left" className="w-6 h-6 text-purple-600 drop-shadow-sm" />
                            </div>
                            <span>opens Advanced Interactive Modal</span>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Node Types & Logic</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
                                <Database className="w-6 h-6 text-gray-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Database Table</span> Source data tables providing inputs.</div>
                            </div>
                            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <Copy className="w-6 h-6 text-blue-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Projection View</span> Simple column forwarding and simple filters. Modals show mappings.</div>
                            </div>
                            <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-lg p-3">
                                <VennIcon vennType="left" className="w-6 h-6 text-purple-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Join View</span> Merges two tables. The detail modal visually clarifies join keys and output mappings.</div>
                            </div>
                            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg p-3">
                                <Layers className="w-6 h-6 text-green-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Aggregation View</span> Aggregates rows (group by) and rolls up measures via sum/min/max.</div>
                            </div>
                            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                <VennIcon vennType="union" className="w-6 h-6 text-indigo-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Union View</span> Appends multiple inputs vertically. Target mapping is beautifully visualized inside the detail modal.</div>
                            </div>
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                <ArrowRightCircle className="w-6 h-6 text-emerald-600" />
                                <div className="text-xs"><span className="font-semibold text-gray-800 block">Output View</span> The final target structure of the calculation view.</div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
