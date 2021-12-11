import { google } from 'googleapis';
import { notNullable, splitArrayIntoChunk } from './utils.js';
import type { youtube_v3 } from 'googleapis';

export const fetchPlaylist = async (
	apiKey: string,
	playlistId: string,
	pageToken: string | undefined = undefined
): Promise<youtube_v3.Schema$PlaylistItemSnippet[]> => {
	const res = await google.youtube('v3').playlistItems.list({
		key: apiKey,
		part: ['snippet'],
		maxResults: 50,
		playlistId,
		pageToken
	});

	return res.data.items?.map((item) => item.snippet)?.filter(notNullable) ?? [];
};

export const fetchVideos = async (
	apiKey: string,
	videoIds: string[]
): Promise<youtube_v3.Schema$Video[]> => {
	const maxResults = 50;
	return splitArrayIntoChunk(videoIds, maxResults).reduce<Promise<youtube_v3.Schema$Video[]>>(
		async (prevPromise, ids: string[]) => {
			const acc = await prevPromise;
			const res = await google.youtube('v3').videos.list({
				key: apiKey,
				part: ['snippet', 'status'],
				maxResults,
				id: ids
			});
			return [...acc, ...(res.data.items ?? [])];
		},
		Promise.resolve([])
	);
};

export const isAutoGeneratedVideo = (description: string): boolean =>
	description.match(/^Provided to YouTube.+Auto-generated by YouTube\.$/s) != null;