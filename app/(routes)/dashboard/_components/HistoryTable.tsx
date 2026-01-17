'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { sessionDetail } from '../medical-agent/[sessionId]/page'
import moment from 'moment'
import ViewReportDailog from './ViewReportDailog'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type Props = {
    historyList: sessionDetail[]
}

function HistoryTable({ historyList }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(historyList.length / itemsPerPage);
    
    const paginatedList = historyList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className='space-y-6'>
            <div className='overflow-hidden rounded-2xl border'>
                <Table>
                    <TableHeader>
                        <TableRow className='bg-muted/50 hover:bg-muted/50'>
                            <TableHead className='font-semibold'>Specialist</TableHead>
                            <TableHead className='font-semibold'>Consultation Notes</TableHead>
                            <TableHead className='font-semibold'>Date</TableHead>
                            <TableHead className="text-right font-semibold">Report</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedList.map((record: sessionDetail, index: number) => (
                            <TableRow key={record.id || index} className='transition-colors hover:bg-muted/30'>
                                <TableCell className="font-medium">
                                    <div className='flex items-center gap-3'>
                                        <div className='h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
                                            <Image 
                                                src={record.selectedDoctor.image || '/placeholder-doctor.png'}
                                                alt={record.selectedDoctor.specialist}
                                                width={40}
                                                height={40}
                                                className='h-full w-full object-cover'
                                            />
                                        </div>
                                        <span>{record.selectedDoctor.specialist}</span>
                                    </div>
                                </TableCell>
                                <TableCell className='max-w-md'>
                                    <p className='line-clamp-2 text-sm text-muted-foreground'>{record.notes || 'No description'}</p>
                                </TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        <span>{moment(new Date(record.createdOn)).format('MMM DD, YYYY')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ViewReportDailog record={record} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Previous Consultation reports.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                            Previous
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[40px]"
                            >
                                {page}
                            </Button>
                        ))}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HistoryTable