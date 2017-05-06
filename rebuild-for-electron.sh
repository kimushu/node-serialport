#!/bin/sh
ELECTRON_VER=$1
ELECTRON_URL="https://atom.io/download/electron"
NODEGYP_HOME="$HOME/.node-gyp"

if [ -z "${ELECTRON_VER}" ]; then
	echo "usage: $0 <electron-version>"
	exit 1
fi

case "$(uname)" in
	Linux)
		ARCHLIST="x64 ia32"
		PLAT=linux
	;;
	Darwin)
		ARCHLIST="x64"
		PLAT=darwin
	;;
	*)
		echo "Unknown platform"
		exit 1
	;;
esac

NODE_VER=""

for ARCH in ${ARCHLIST}
do
	echo "#================================================================================"
	echo "# Rebuilding module for Electron ${ELECTRON_VER} (${ARCH})"
	echo "#"
	src="build/Release/serialport.node"
	rm -f ${src}

	cmd="node-gyp rebuild --target=${ELECTRON_VER} --arch=${ARCH} --dist-url=${ELECTRON_URL}"
	echo "> $cmd"
	$cmd || exit 1

	if [ -z "${NODE_VER}" ]; then
		echo "# Detecting node version"
		header="${NODEGYP_HOME}/iojs-${ELECTRON_VER}/src/node_version.h"
		if [ ! -e "${header}" ]; then
			echo "${header} not found"
			exit 1
		fi
		for item in MAJOR MINOR PATCH
		do
			eval ver_$item=$(sed -ne "s/^\\s*#\\s*define\\s\+NODE_${item}_VERSION\\s\+\([0-9]\+\)\\r\?\$/\1/p" ${header})
		done
		if [ -z "${ver_MAJOR}" -o -z "${ver_MINOR}" -o -z "${ver_PATCH}" ]; then
			echo "Failed to get node version"
			exit 1
		fi
		NODE_VER="${ver_MAJOR}.${ver_MINOR}.${ver_PATCH}"
		echo "# Node version: ${NODE_VER}"
	fi

	destdir="compiled/${NODE_VER}/${PLAT}/${ARCH}"
	dest="${destdir}/serialport.node"
	echo "# Copying binary (${dest})"
	mkdir -p ${destdir}
	cp ${src} ${dest} || exit 1
done

echo "# Done."
